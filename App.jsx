import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [notesList, setNotesList] = useState([]);
  
  // Selected Note दाखवण्यासाठी नवीन State
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchNotes(currentUser.uid);
      else setNotesList([]);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      setEmail(''); 
      setPassword('');
    } catch (error) { 
      alert(error.message); 
    } 
  };

  const handleLogout = () => signOut(auth);

  const fetchNotes = async (userId) => {
    try {
      const q = query(collection(db, 'student_notes'), where('userId', '==', userId));
      const data = await getDocs(q);
      const fetchedNotes = data.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotesList(fetchedNotes);
      if (fetchedNotes.length > 0 && !selectedNote) {
        setSelectedNote(fetchedNotes[0]); // बाय-डिफॉल्ट पहिली नोट सिलेक्ट राहील
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title || !note) return alert('Please enter title and note!');

    try {
      if (editId) {
        await updateDoc(doc(db, 'student_notes', editId), { title, note });
        setEditId(null);
      } else {
        await addDoc(collection(db, 'student_notes'), { 
          title, 
          note, 
          userId: user.uid, 
          userEmail: user.email || 'No Email', 
          createdAt: new Date().toLocaleDateString() 
        });
      }

      setTitle(''); 
      setNote('');
      alert('Note saved successfully!');
      fetchNotes(user.uid);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Error saving note: " + err.message); 
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteDoc(doc(db, 'student_notes', id));
      setSelectedNote(null);
      fetchNotes(user.uid);
    } catch (err) {
      alert("Error deleting note: " + err.message);
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id); 
    setTitle(item.title); 
    setNote(item.note);
  };

  const filteredNotes = notesList.filter((item) => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DeveloperContact = () => {
    const [showHelp, setShowHelp] = useState(false);

    return (
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          {showHelp ? 'Hide Help Center' : 'Help Center'}
        </button>

        {showHelp && (
          <div style={{
            paddingTop: '15px',
            borderTop: '1px solid #444',
            fontSize: '14px',
            color: '#aaa',
            backgroundColor: '#1e1e1e',
            padding: '15px',
            borderRadius: '8px'
          }}>
            <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#ddd' }}>
              Need Help or Facing Issues?
            </p>
            <p style={{ margin: '5px 0' }}>
              Developer: <span style={{ color: '#fff', fontWeight: 'bold' }}>Jay Pawar</span>
            </p>
            <p style={{ margin: '5px 0' }}>
              Email: <a href="mailto:jaypawar8399@gmail.com" style={{ color: '#4CAF50', textDecoration: 'none' }}>jaypawar8399@gmail.com</a>
            </p>
            <p style={{ margin: '5px 0' }}>
              Contact: <a href="tel:8317289128" style={{ color: '#4CAF50', textDecoration: 'none' }}>+91 8317289128</a>
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div style={{ padding: '30px', color: 'white', maxWidth: '400px', margin: '30px auto', textAlign: 'center' }}>
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email..." 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required 
            style={{ padding: '10px', borderRadius: '5px' }} 
          />
          <input 
            type="password" 
            placeholder="Password..." 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
            style={{ padding: '10px', borderRadius: '5px' }} 
          />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
            {isRegistering ? 'Create Account' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '15px', cursor: 'pointer', color: '#4CAF50' }} onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
        <DeveloperContact />
      </div>
    );
  }

  return (
    <div style={{ color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#1f1f1f', borderBottom: '1px solid #333' }}>
        <h2>Student Notes App</h2>
        <div>
          <span style={{ marginRight: '15px', fontSize: '14px', color: '#bbb' }}>{user.email}</span>
          <button onClick={handleLogout} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Sidebar Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar Menu */}
        <div style={{ width: '280px', backgroundColor: '#181818', padding: '20px', borderRight: '1px solid #333' }}>
          <button 
            onClick={() => { setSelectedNote(null); setEditId(null); setTitle(''); setNote(''); }}
            style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
          >
            + Create New Note
          </button>

          <input 
            type="text" 
            placeholder="🔍 Search..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ padding: '8px', width: '100%', borderRadius: '5px', marginBottom: '15px', boxSizing: 'border-box' }} 
          />

          <h3 style={{ fontSize: '16px', color: '#888', marginBottom: '10px' }}>SAVED NOTES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
            {filteredNotes.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedNote(item)}
                style={{ 
                  padding: '10px 12px', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  backgroundColor: selectedNote?.id === item.id ? '#007bff' : '#262626',
                  color: '#fff',
                  fontWeight: selectedNote?.id === item.id ? 'bold' : 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                📝 {item.title || 'Untitled Note'}
              </div>
            ))}
          </div>
          
          <DeveloperContact />
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, padding: '30px', backgroundColor: '#121212' }}>
          {/* Form / Note Creator */}
          <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
            <h3>{editId ? 'Edit Note' : 'Add New Note'}</h3>
            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Note Title..." 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                style={{ padding: '10px', borderRadius: '5px' }} 
              />
              <textarea 
                placeholder="Write your note here..." 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                rows="3" 
                style={{ padding: '10px', borderRadius: '5px' }} 
              />
              <button type="submit" style={{ padding: '10px', width: '150px', borderRadius: '5px', backgroundColor: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
                {editId ? 'Update Note' : 'Save Note'}
              </button>
            </form>
          </div>

          {/* Selected Note Display */}
          {selectedNote ? (
            <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #007bff' }}>
              <h2>{selectedNote.title}</h2>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd', margin: '15px 0' }}>{selectedNote.note}</p>
              <hr style={{ borderColor: '#333' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <small style={{ color: '#888' }}>Created: {selectedNote.createdAt} | By: {selectedNote.userEmail}</small>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEditClick(selectedNote)} style={{ backgroundColor: '#FF9800', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteNote(selectedNote.id)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
              <h3>Select a note from the sidebar to view details.</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;