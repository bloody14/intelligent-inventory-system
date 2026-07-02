import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import chromadb

# 1. Connect to both SQLite and ChromaDB pipelines
models.Base.metadata.create_all(bind=engine)
db: Session = SessionLocal()

chroma_client = chromadb.PersistentClient(path="./chroma_data")
vector_collection = chroma_client.get_or_create_collection(name="inventory_vectors")

# 📊 MANUALLY DESIGNED DATA BASE GENERATORS
# These arrays are cross-multiplied mathematically to generate over 1,000 unique items
brands = [
    "Sony", "Apple", "Samsung", "Logitech", "Razer", "Dell", "HP", "Asus", "Lenovo", "Corsair",
    "Nike", "Adidas", "Puma", "UnderArmour", "Zara", "H&M", "Levi's", "TommyHilfiger", "Cosco", "MRF"
]

modifier_words = [
    "Ultra", "Pro", "Max", "Air", "Elite", "Quantum", "Sonic", "Alpha", "Apex", "Prime",
    "Matrix", "Titan", "Vortex", "Core", "Classic", "Premium", "Sport", "Stealth", "Wireless", "RGB"
]

item_catalog = {
    "Electronics": [
        "Gaming Mouse", "Mechanical Keyboard", "OLED Monitor", "Wireless Earbuds", "Smart Watch", 
        "Graphics Card", "USB-C Hub", "External SSD", "RGB Desk Mat", "Bluetooth Speaker", 
        "HD Webcam", "Laptop Cooling Pad", "Noise Cancelling Headphones", "Power Bank", "VR Headset"
    ],
    "Apparel & Clothing": [
        "Slim-fit Jeans", "Oversized Hoodie", "Graphic T-Shirt", "Cargo Pants", "Cuffed Joggers", 
        "Denim Jacket", "Linen Shirt", "Sports Socks", "Windbreaker", "Leather Belt", 
        "Beanie Hat", "Puffer Vest", "Polo Neck Shirt", "Tracksuit", "Sweatshirt"
    ],
    "Sports & Fitness": [
        "Cricket Bat", "Leather Cricket Ball", "Badminton Racket", "Shuttlecock Pack", "Yoga Mat", 
        "Dumbbell Set", "Running Shoes", "Skipping Rope", "Gym Shaker", "Sports Backpack", 
        "Football", "Resistance Bands", "Knee Support Pad", "Gym Gloves", "Tennis Racket"
    ],
    "Office & Study": [
        "Ergonomic Desk Chair", "Notebook Journal", "Gel Pen Set", "Magnetic Whiteboard", "Desk Organizer", 
        "Dual-Mode Stylus", "Desk Lamp", "Reading Glasses", "Paper Shredder", "Sticky Notes Pack",
        "Calculators", "File Folder Binder", "Desk Calendar", "Laptop Stand", "Footrest Cushion"
    ]
}

print("⚡ Starting generation engine for 1,000+ structured dataset records...")

# Ensure a fallback owner exists
first_user = db.query(models.DBUser).first()
if not first_user:
    print("⚠️ No user found in SQLite! Registering default profile row 'kundan'...")
    import bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw("password123".encode('utf-8'), salt).decode('utf-8')
    first_user = models.DBUser(username="kundan", email="kundan@example.com", hashed_password=hashed)
    db.add(first_user)
    db.commit()
    db.refresh(first_user)

owner_id = first_user.id

sqlite_items = []
generated_names = set()

# 🔄 DETERMINISTIC CROSS-MULTIPLICATION LOOP
# This forces the generator to build exactly 1,100 unique combinations
print("📦 Compiling unique dataset entries...")
for category, items in item_catalog.items():
    for item in items:
        for brand in brands:
            for mod in modifier_words:
                if len(sqlite_items) >= 1100:
                    break
                
                # Alternate naming formulas so the names look completely realistic
                if len(sqlite_items) % 3 == 0:
                    name = f"{brand} {mod} {item}"
                elif len(sqlite_items) % 3 == 1:
                    name = f"{brand} {item} {mod}"
                else:
                    name = f"{mod} {item} by {brand}"
                
                if name in generated_names:
                    continue
                generated_names.add(name)
                
                # Apply balanced product pricing matrix based on category
                if category == "Electronics":
                    price = round(random.uniform(1500.0, 85000.0), 2)
                elif category == "Apparel & Clothing":
                    price = round(random.uniform(499.0, 5500.0), 2)
                elif category == "Sports & Fitness":
                    price = round(random.uniform(299.0, 16000.0), 2)
                else:
                    price = round(random.uniform(120.0, 9500.0), 2)
                
                db_item = models.DBItem(
                    name=name,
                    price=price,
                    is_offer=random.choice([True, False]),
                    owner_id=owner_id
                )
                sqlite_items.append(db_item)

print(f"💾 Inserting {len(sqlite_items)} rows inside local SQLite database file...")
db.bulk_save_objects(sqlite_items)
db.commit()

# Pull back rows to map exact incremental sequence IDs
all_saved_items = db.query(models.DBItem).order_by(models.DBItem.id.desc()).limit(len(sqlite_items)).all()

print("🧠 Commencing vector compilation into ChromaDB (Generating 1,100 embeddings)...")

documents_batch = []
metadatas_batch = []
ids_batch = []

for item in all_saved_items:
    documents_batch.append(item.name)
    metadatas_batch.append({"price": float(item.price), "sqlite_id": int(item.id)})
    ids_batch.append(f"item_{item.id}")

# Send the entire list to ChromaDB at once
vector_collection.add(
    documents=documents_batch,
    metadatas=metadatas_batch,
    ids=ids_batch
)

print(f"🏁 DONE! Your database is officially loaded with {len(sqlite_items)} realistic products!")
db.close()