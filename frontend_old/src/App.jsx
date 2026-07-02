// import { useState, useEffect } from 'react';

// function App() {
  
//   const [name, setName] = useState("");
//   const [price, setPrice] = useState("");
  
  
//   const [mongoItems, setMongoItems] = useState([]);
//   const [pythonItems, setPythonItems] = useState([]);
//   const [status, setStatus] = useState("");

//   // 🔄 Fetch data from both backends when the page loads
//   const fetchAllData = async () => {
//     // 1. Fetch from Node.js + MongoDB
//     try {
//       const res = await fetch('http://localhost:5000/items');
//       const data = await res.json();
//       setMongoItems(data);
//     } catch (err) {
//       console.error("Failed to fetch from Node backend", err);
//     }

//     // 2. Fetch from Python Backend (Adjust URL path if your Python GET route is different)
//     try {
//       const res = await fetch('http://localhost:8000/items');
//       const data = await res.json();
//       setPythonItems(data);
//     } catch (err) {
//       console.error("Failed to fetch from Python backend", err);
//     }
//   };

//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   // ⚡ Submit handler to save an item to MongoDB Cloud
//   const handleSubmitMongo = async (e) => {
//     e.preventDefault();
//     setStatus("Saving to MongoDB Cloud...");
//     try {
//       const response = await fetch('http://localhost:5000/items', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name, price: Number(price) })
//       });
//       if (response.ok) {
//         setStatus("🔥 Successfully saved to MongoDB Cloud!");
//         setName("");
//         setPrice("");
//         fetchAllData(); // Refresh lists
//       }
//     } catch (err) {
//       setStatus("❌ Network Error connecting to Node Backend.");
//     }
//   };

//   return (
//     <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '900px', margin: 'auto', backgroundColor: '#fafafa', minHeight: '100vh' }}>
//       <h1 style={{ textAlign: 'center', color: '#2C3E50' }}>🌐 My Polyglot Full-Stack Bridge</h1>
//       <p style={{ textAlign: 'center', color: '#7F8C8D' }}>One React Frontend talking to Python (SQLite) and Node.js (MongoDB Cloud)</p>
      
//       <hr style={{ border: '0', height: '1px', background: '#ccc', margin: '20px 0' }} />

//       {/* Input Form Section */}
//       <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
//         <h3 style={{ margin: '0 0 15px 0', color: '#2980B9' }}>➕ Add New Item (via Node.js ➡️ MongoDB)</h3>
//         <form onSubmit={handleSubmitMongo} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
//           <div style={{ flex: 1 }}>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Item Name:</label>
//             <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
//           </div>
//           <div style={{ flex: 1 }}>
//             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (INR):</label>
//             <input type="number" value={price} onChange={e => setPrice(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }} />
//           </div>
//           <button type="submit" style={{ padding: '9px 20px', background: '#2980B9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save to Cloud</button>
//         </form>
//         {status && <p style={{ marginTop: '10px', color: '#16A085', fontWeight: 'bold' }}>{status}</p>}
//       </div>

//       {/* Data Visualizer Grids */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
//         {/* Node.js/MongoDB Side */}
//         <div style={{ background: '#E8F8F5', padding: '20px', borderRadius: '8px', borderTop: '5px solid #1ABC9C' }}>
//           <h3 style={{ color: '#16A085', marginTop: 0 }}>💾 MongoDB Atlas Cloud Data</h3>
//           <p style={{ fontSize: '12px', color: '#7F8C8D' }}>Managed via Express (Port 5000)</p>
//           <ul>
//             {mongoItems.length === 0 ? <li>No cloud items found.</li> : 
//               mongoItems.map((item) => (
//                 <li key={item._id} style={{ margin: '8px 0' }}>
//                   <strong>{item.name}</strong> — ₹{item.price}
//                 </li>
//               ))
//             }
//           </ul>
//         </div>

//         {/* Python/SQLite Side */}
//         <div style={{ background: '#FEF9E7', padding: '20px', borderRadius: '8px', borderTop: '5px solid #F1C40F' }}>
//           <h3 style={{ color: '#D4AC0D', marginTop: 0 }}>🐍 Python SQLite Local Data</h3>
//           <p style={{ fontSize: '12px', color: '#7F8C8D' }}>Managed via Python Server (Port 8000)</p>
//           <ul>
//             {pythonItems.length === 0 ? <li>No local python items found.</li> : 
//               pythonItems.map((item, idx) => (
//                 <li key={idx} style={{ margin: '8px 0' }}>
//                   <strong>{item.name}</strong> — ₹{item.price}
//                 </li>
//               ))
//             }
//           </ul>
//         </div>

//       </div>
//     </div>
//   );
// }

// export default App;



import { useState, useEffect } from 'react';

function App() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [mongoItems, setMongoItems] = useState([]);
  const [pythonItems, setPythonItems] = useState([]);
  const [status, setStatus] = useState("");

  // 🔄 Fetch data safely from both backends
  const fetchAllData = async () => {
    // 1. Fetch from Node.js (MongoDB)
    try {
      const res = await fetch('http://localhost:5000/items');
      if (res.ok) {
        const data = await res.json();
        setMongoItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch from Node backend", err);
    }

    // 2. Fetch from Python (FastAPI + SQLite)
    try {
      const res = await fetch('http://localhost:8000/items/'); // Added explicit slash
      if (res.ok) {
        const data = await res.json();
        // 💡 SAFE UNPACKING: Specifically target the 'items' array key from your FastAPI return object
        if (data && data.items) {
          setPythonItems(data.items);
        } else if (Array.isArray(data)) {
          setPythonItems(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch from Python backend", err);
    }
  };

  // Run once on initial layout mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // 💾 Save to MongoDB Cloud
  const handleSaveToMongo = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    setStatus("Sending to MongoDB Cloud...");
    try {
      const response = await fetch('http://localhost:5000/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price) })
      });
      if (response.ok) {
        setStatus("💾 Successfully saved to MongoDB Cloud!");
        setName("");
        setPrice("");
        fetchAllData();
      } else {
        setStatus("❌ Node server rejected the entry.");
      }
    } catch (err) {
      setStatus("❌ Error connecting to Node Backend.");
    }
  };

  // 🐍 Save to Python SQLite
  const handleSaveToPython = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    setStatus("Sending to Python SQLite...");
    try {
      // 💡 FIXED: Added the strict trailing slash to match your FastAPI router path
      const response = await fetch('http://localhost:8000/items/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), is_offer: false, owner_id: 1 })
      });
      if (response.ok) {
        setStatus("🐍 Successfully saved to Python FastAPI Database!");
        setName("");
        setPrice("");
        fetchAllData();
      } else {
        setStatus("❌ Python server rejected the entry (Check if owner_id: 1 exists).");
      }
    } catch (err) {
      setStatus("❌ Error connecting to Python Backend.");
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '900px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', color: '#2C3E50' }}>🌐 The Dual-Backend System Dashboard</h1>
      <p style={{ textAlign: 'center', color: '#7F8C8D' }}>Control both Node.js (MongoDB) and Python (FastAPI + SQLite) engines side-by-side</p>
      <hr />

      {/* Input Fields Form Box */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2C3E50' }}>📦 Item Creator Control Panel</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Item Name:</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mechanical Keyboard" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (INR):</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 4500" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={handleSaveToMongo} style={{ flex: 1, padding: '12px', background: '#1ABC9C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            🚀 Save to MongoDB Cloud
          </button>
          <button onClick={handleSaveToPython} style={{ flex: 1, padding: '12px', background: '#F1C40F', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            🐍 Save to Python SQLite
          </button>
        </div>

        {status && <p style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderLeft: '4px solid #2C3E50', fontWeight: 'bold', color: '#2C3E50' }}>{status}</p>}
      </div>

      {/* Realtime Dual-Database Grid Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* MongoDB Cloud Interface Render */}
        <div style={{ background: '#E8F8F5', padding: '20px', borderRadius: '8px', borderTop: '5px solid #1ABC9C', minHeight: '200px' }}>
          <h3 style={{ color: '#16A085', marginTop: 0 }}>💾 MongoDB Atlas Cloud Data</h3>
          <p style={{ fontSize: '12px', color: '#7F8C8D' }}>Port 5000 Engine</p>
          <ul style={{ paddingLeft: '20px' }}>
            {mongoItems.length === 0 ? <li>No cloud items found.</li> : 
              mongoItems.map((item) => (
                <li key={item._id || item.id} style={{ margin: '8px 0' }}>
                  <strong>{item.name}</strong> — ₹{item.price}
                </li>
              ))
            }
          </ul>
        </div>

        {/* Python SQLite Interface Render */}
        <div style={{ background: '#FEF9E7', padding: '20px', borderRadius: '8px', borderTop: '5px solid #F1C40F', minHeight: '200px' }}>
          <h3 style={{ color: '#D4AC0D', marginTop: 0 }}>🐍 Python SQLite Local Data</h3>
          <p style={{ fontSize: '12px', color: '#7F8C8D' }}>Port 8000 Engine</p>
          <ul style={{ paddingLeft: '20px' }}>
            {pythonItems.length === 0 ? <li>No local python items found.</li> : 
              pythonItems.map((item, idx) => (
                <li key={item.id || idx} style={{ margin: '8px 0' }}>
                  <strong>{item.name}</strong> — ₹{item.price} {item.username && `(Owner: ${item.username})`}
                </li>
              ))
            }
          </ul>
        </div>

      </div>
    </div>
  );
}

export default App;