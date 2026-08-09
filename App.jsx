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
  
  const [selectedNote, setSelectedNote] = useState(null);
  const [viewMode, setViewMode] = useState('create');

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
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Account Created Successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail(''); 
      setPassword('');
    } catch (error) { 
      if (error.code === 'auth/email-already-in-use') {
        alert("This email is already registered! Switching to Login screen.");
        setIsRegistering(false);
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        alert("Invalid email or password!");
      } else {
        alert("Authentication Error: " + error.message);
      }
    } 
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSelectedNote(null);
      setViewMode('create');
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  const fetchNotes = async (userId) => {
    try {
      const q = query(collection(db, 'student_notes'), where('userId', '==', userId));
      const data = await getDocs(q);
      const fetchedNotes = data.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotesList(fetchedNotes);
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
        alert('Note updated successfully!');
      } else {
        await addDoc(collection(db, 'student_notes'), { 
          title, 
          note, 
          userId: user.uid, 
          userEmail: user.email || 'No Email', 
          createdAt: new Date().toLocaleDateString() 
        });
        alert('Note saved successfully!');
      }

      setTitle(''); 
      setNote('');
      setViewMode('create');
      fetchNotes(user.uid);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Error saving note: " + err.message); 
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteDoc(doc(db, 'student_notes', id));
      setSelectedNote(null);
      setViewMode('create');
      alert("Note deleted successfully!");
      fetchNotes(user.uid);
    } catch (err) {
      alert("Error deleting note: " + err.message);
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id); 
    setTitle(item.title); 
    setNote(item.note);
    setViewMode('edit');
  };

  // Hover Event to slide and open Note when hovering with mouse
  const handleNoteHover = (item) => {
    setSelectedNote(item);
    if (viewMode !== 'edit') {
      setViewMode('view');
    }
  };

  const handleCreateNewClick = () => {
    setSelectedNote(null);
    setEditId(null);
    setTitle('');
    setNote('');
    setViewMode('create');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setTitle('');
    setNote('');
    setViewMode('create');
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
          <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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
      {/* CSS Animation for Sliding Effect & Hover Effects */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .slide-panel {
          animation: slideIn 0.3s ease-in-out forwards;
        }
        .note-item {
          transition: all 0.2s ease-in-out;
        }
        .note-item:hover {
          transform: translateX(5px);
          background-color: #333 !important;
        }
        .logout-btn {
          background-color: #ff4d4d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease-in-out;
        }
        .logout-btn:hover {
          transform: scale(1.05);
          background-color: #e60000;
          box-shadow: 0 4px 8px rgba(255, 77, 77, 0.4);
        }
      `}</style>

      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#1f1f1f', borderBottom: '1px solid #333' }}>
        <h2>Student Notes Save App</h2>
        <div>
          <span style={{ marginRight: '15px', fontSize: '14px', color: '#bbb' }}>{user.email}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout 🚪
          </button>
        </div>
      </div>

      {/* Main Sidebar Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar Menu */}
        <div style={{ width: '300px', backgroundColor: '#181818', padding: '20px', borderRight: '1px solid #333' }}>
          
          <button 
            onClick={handleCreateNewClick}
            style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
          >
            + Create New Note
          </button>

          <input 
            type="text" 
            placeholder="🔍 Search notes..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ padding: '8px', width: '100%', borderRadius: '5px', marginBottom: '15px', boxSizing: 'border-box' }} 
          />

          <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '10px', letterSpacing: '1px' }}>SAVED NOTES</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto' }}>
            {filteredNotes.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px' }}>No notes found.</p>
            ) : (
              filteredNotes.map((item) => (
                <div 
                  key={item.id} 
                  className="note-item" 
                  onMouseEnter={() => handleNoteHover(item)}
                  onClick={() => handleNoteHover(item)}
                  style={{ 
                    padding: '12px', 
                    borderRadius: '6px', 
                    backgroundColor: selectedNote?.id === item.id && viewMode === 'view' ? '#007bff' : '#262626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <span 
                    style={{ 
                      flex: 1, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      fontWeight: selectedNote?.id === item.id ? 'bold' : 'normal'
                    }}
                  >
                    📝 {item.title || 'Untitled'}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <DeveloperContact />
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, padding: '30px', backgroundColor: '#121212', overflow: 'hidden' }}>
          
          {/* View Mode with CSS Slide Animation */}
          {viewMode === 'view' && selectedNote && (
            <div className="slide-panel" style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#fff' }}>{selectedNote.title}</h2>
                <span style={{ fontSize: '12px', color: '#17a2b8', backgroundColor: '#0e2a30', padding: '4px 8px', borderRadius: '4px' }}>Hover Viewing Mode</span>
              </div>
              
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd', whiteSpace: 'pre-wrap', backgroundColor: '#181818', padding: '15px', borderRadius: '5px' }}>
                {selectedNote.note}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333' }}>
                <small style={{ color: '#888' }}>Created: {selectedNote.createdAt} | By: {selectedNote.userEmail}</small>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEditClick(selectedNote)} style={{ backgroundColor: '#FF9800', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDeleteNote(selectedNote.id)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create / Edit Form Mode */}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '8px' }}>
              <h3>{viewMode === 'edit' ? '✏️ Edit Note' : '➕ Add New Note'}</h3>
              <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="Note Title..." 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  style={{ padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444' }} 
                />
                <textarea 
                  placeholder="Write your note here..." 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  rows="6" 
                  style={{ padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444' }} 
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: '5px', backgroundColor: '#007bff', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    {viewMode === 'edit' ? 'Update Note' : 'Save Note'}
                  </button>
                  
                  {viewMode === 'edit' && (
                    <button type="button" onClick={handleCancelEdit} style={{ padding: '10px 20px', borderRadius: '5px', backgroundColor: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;