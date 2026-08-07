import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('C Language');
  const [desc, setDesc] = useState('');
  const [notes, setNotes] = useState([]);

  // 1. Check Login State & Fetch Notes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(
          collection(db, "notes"), 
          where("uid", "==", currentUser.uid)
        );
        const unsubNotes = onSnapshot(q, (snapshot) => {
          setNotes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
        return () => unsubNotes();
      } else {
        setNotes([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Auth Logic (Login / Register)
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Email and Password fields are required!');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Account Successfully Created!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Save Note to Cloud
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title || !desc) return alert('Title and Note fields are required!');
    try {
      await addDoc(collection(db, "notes"), {
        title,
        category,
        desc,
        uid: user.uid,
        createdAt: new Date().toLocaleDateString()
      });
      setTitle('');
      setDesc('');
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. Delete Note
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------- UI: Login / Register Form ----------------
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>🎓 Student Notes Vault</h2>
          <p>{isRegistering ? 'Create a new account' : 'Login to your account'}</p>
          
          <form onSubmit={handleAuth}>
            <input 
              type="email" 
              placeholder="Email ID" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password (Minimum 6 characters)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-primary">
              {isRegistering ? 'Create Account 🚀' : 'Login 🔑'}
            </button>
          </form>

          <p className="toggle-text">
            {isRegistering ? 'Already have an account?' : 'New user?'} 
            <span onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? ' Login' : ' Register'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ---------------- UI: Main Dashboard ----------------
  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div>
          <h2>🎓 Student Notes Vault</h2>
          <small>Logged in: <b>{user.email}</b></small>
        </div>
        <button className="btn-logout" onClick={() => signOut(auth)}>Logout 🚪</button>
      </header>

      {/* Note Form */}
      <div className="note-form-card">
        <h3>➕ Add New Note</h3>
        <form onSubmit={handleSaveNote}>
          <div className="form-group">
            <input 
              type="text" 
              placeholder="Topic / Title (e.g., File Handling)" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="C Language">C Language</option>
              <option value="React JS">React JS</option>
              <option value="Cyber Security">Cyber Security</option>
              <option value="General Notes">General Notes</option>
            </select>
          </div>
          <textarea 
            placeholder="Enter your notes or code snippets here..." 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)}
            rows="4"
          ></textarea>
          <button type="submit" className="btn-save">Save Note to Cloud ☁️</button>
        </form>
      </div>

      {/* Notes Display */}
      <div className="notes-grid">
        {notes.length === 0 ? (
          <p className="no-notes">No notes saved yet!</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="note-card">
              <div className="card-header">
                <span className="tag">{note.category}</span>
                <small>{note.createdAt}</small>
              </div>
              <h4>{note.title}</h4>
              <p>{note.desc}</p>
              <button className="btn-delete" onClick={() => handleDelete(note.id)}>Delete 🗑️</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;    <button className="btn-delete" onClick={() => handleDelete(note.id)}>Delete 🗑️</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;