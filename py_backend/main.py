 
from google import genai
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import chromadb
from chromadb.config import Settings

import models
from database import SessionLocal, engine
import bcrypt
import jwt
import datetime
from fastapi.middleware.cors import CORSMiddleware

import os
from dotenv import load_dotenv

load_dotenv()

models.Base.metadata.create_all(bind=engine)
chroma_client = chromadb.PersistentClient(path="./chroma_data")
vector_collection = chroma_client.get_or_create_collection(name="inventory_vectors")
ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",  # Vite React Dev Port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ItemCreate(BaseModel):
    name: str
    price: float
    is_offer: bool = False
    owner_id: int = None 

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Database created successfully"}


@app.post("/items")
@app.post("/items/")
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    assigned_owner = None
    if item.owner_id:
        db_user = db.query(models.DBUser).filter(models.DBUser.id == item.owner_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        assigned_owner = db_user
    else:
        first_user = db.query(models.DBUser).first()
        if first_user:
            assigned_owner = first_user

    # 1. Save record into relational SQLite
    db_item = models.DBItem(
        name=item.name, 
        price=item.price, 
        is_offer=item.is_offer, 
        owner=assigned_owner
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # 2. AI VECTOR INSERTION: Generate and store the embedding inside ChromaDB
    try:
        vector_collection.add(
            documents=[item.name],              
            metadatas=[{"price": item.price, "sqlite_id": db_item.id}], 
            ids=[f"item_{db_item.id}"]          
        )
        print(f"AI Sync Success: Linked '{item.name}' vector embedding inside ChromaDB.")
    except Exception as e:
        print(f"Vector DB Error: Failed to generate embedding. Details: {str(e)}")

    return {"status": "Item created successfully", "item": db_item}


@app.get("/items")
@app.get("/items/")
def read_all_items(db: Session = Depends(get_db)):
    items = db.query(models.DBItem).all()
    response_items = []
    for item in items:
        response_items.append({
            "id": item.id,
            "name": item.name,
            "price": item.price,
            "is_offer": item.is_offer,
            "owner_id": item.owner_id,
            "username": item.owner.username if item.owner else None
        })
    return response_items


@app.get("/items/{item_id}")
def read_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.DBItem).filter(models.DBItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"item": item}


@app.put("/items/{item_id}")
def update_item(item_id: int, item: ItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(models.DBItem).filter(models.DBItem.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    db_item.name = item.name
    db_item.price = item.price
    db_item.is_offer = item.is_offer
    db.commit()
    db.refresh(db_item)
    return {"status": "Item updated successfully", "item": db_item}


@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.DBItem).filter(models.DBItem.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
    return {"status": "Item deleted successfully"}


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


SECRET_KEY = "super_secret_signing_key_change_me_in_production"
ALGORITHM = "HS256"

@app.post("/login/")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.DBUser).filter(models.DBUser.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username or password")
        
    user_password_bytes = user.password.encode('utf-8')
    stored_hash_bytes = db_user.hashed_password.encode('utf-8')
    
    if not bcrypt.checkpw(user_password_bytes, stored_hash_bytes):
        raise HTTPException(status_code=400, detail="Invalid username or password")
        
    expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    token_payload = {
        "sub": db_user.username,
        "exp": expiration
    }
    
    token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/signup/")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.DBUser).filter(models.DBUser.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    secure_hash_string = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    db_user = models.DBUser(
        username=user.username,
        email=user.email,
        hashed_password=secure_hash_string
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"status": "User created successfully", "user": db_user}


# CHANGED: Explicitly serializing database structures to standard primitive Python objects
@app.get("/ai-inspect")
@app.get("/ai-inspect/")
def inspect_vectors():
    try:
        total_count = vector_collection.count()
        
        if total_count == 0:
            return {
                "total_vectors_in_db": 0,
                "message": "Vector database collection is initialized but completely empty. Add an item from the dashboard first!",
                "vector_records": {}
            }
            
        results = vector_collection.get(include=["embeddings", "documents", "metadatas"])
        
        # CLEAN CONVERSION: Manually map arrays to native Python arrays so FastAPI can encode it perfectly
        sanitized_embeddings = []
        if results.get("embeddings") is not None:
            for vector in results["embeddings"]:
                # Cast each coordinate list to standard Python float values
                sanitized_embeddings.append([float(x) for x in vector])
        
        return {
            "total_vectors_in_db": total_count,
            "vector_records": {
                "ids": results.get("ids", []),
                "documents": results.get("documents", []),
                "metadatas": results.get("metadatas", []),
                "embeddings": sanitized_embeddings
            }
        }
    except Exception as e:
        print(f"AI Inspect Route Crash: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Vector DB Error: {str(e)}")
    
# Pydantic schema for the incoming search text
class AISearchQuery(BaseModel):
    prompt: str
    num_results: int = 3

# AI SEMANTIC LOOKUP ROUTE: Search data by conceptual meaning instead of exact keywords
@app.post("/ai-search")
@app.post("/ai-search/")
def semantic_search(query: AISearchQuery):
    try:
        # Check if we even have records inside ChromaDB
        if vector_collection.count() == 0:
            return {"message": "No vector items found to search through.", "results": []}

        # ChromaDB automatically embeds the user's search prompt 
        # and measures the geometric angle/distance to find the nearest matches
        search_results = vector_collection.query(
            query_texts=[query.prompt],
            n_results=query.num_results
        )

        # Structure the vector response cleanly for our frontend UI
        formatted_matches = []
        # Extract matches safely from the dictionary arrays ChromaDB returns
        for i in range(len(search_results["ids"][0])):
            formatted_matches.append({
                "id": search_results["ids"][0][i],
                "item_name": search_results["documents"][0][i],
                "metadata": search_results["metadatas"][0][i],
                "distance_score": search_results["distances"][0][i] # Closer to 0 means a higher semantic match!
            })

        return {
            "query_processed": query.prompt,
            "closest_matches": formatted_matches
        }
    except Exception as e:
        print(f"AI Search Route Crash: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Semantic Search Error: {str(e)}")
    
# Pydantic schema for the incoming chat message
class AIChatPrompt(BaseModel):
    user_message: str

# THE RAG ENGINE ENDPOINT: Combines Vector Retrieval with Gemini Generation
@app.post("/ai-chat")
@app.post("/ai-chat/")
def inventory_ai_assistant(prompt: AIChatPrompt):
    try:
        # 1. RETRIEVAL: Search ChromaDB to find the top 5 items matching what the user is asking for
        search_results = vector_collection.query(
            query_texts=[prompt.user_message],
            n_results=5
        )
        
        # Extract the documents found by our vector collection
        matched_items = search_results["documents"][0] if search_results["documents"] else []
        matched_metadatas = search_results["metadatas"][0] if search_results["metadatas"] else []
        
        # 2. CONTEXT BUILDING: Format the database matches cleanly into a text block
        db_context = ""
        for i in range(len(matched_items)):
            name = matched_items[i]
            price = matched_metadatas[i].get("price", "N/A")
            db_context += f"- Item: {name} | Price: ₹{price}\n"
            
        if not db_context:
            db_context = "No closely matching inventory items found in the database store."

        # 3. PROMPT ENGINEERING: Construct the system instructions for Gemini
        system_instructions = (
            "You are an intelligent, expert retail inventory assistant and shopping mentor. "
            "Your job is to read the user's request and recommend products using ONLY the inventory data "
            "provided below. Be conversational, direct, and highlight the pricing details in INR (₹) accurately.\n\n"
            f"--- AVAILABLE INVENTORY DATA FROM DB ---\n{db_context}\n"
        )
        
        # 4. GENERATION: Fire the engineered prompt directly to the Gemini 2.5 Flash model
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                {"role": "user", "parts": [{"text": f"{system_instructions}\nUser Question: {prompt.user_message}"}]}
            ]
        )
        
        return {
            "user_query": prompt.user_message,
            "items_retrieved_from_db": matched_items,
            "ai_response": response.text
        }
        
    except Exception as e:
        print(f"RAG Engine Crash: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Assistant Error: {str(e)}")