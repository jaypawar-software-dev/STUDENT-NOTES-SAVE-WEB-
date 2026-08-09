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
  const [viewMode, setViewMode] = useState('create'); // 'create', 'view', 'edit'
  
  // Menu Open/Close State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      setIsMenuOpen(false);
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
      setSelectedNote(null);
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
    setIsMenuOpen(false);
  };

  const handleNoteClick = (item) => {
    setSelectedNote(item);
    setViewMode('view');
    setIsMenuOpen(false);
  };

  const handleCreateNewClick = () => {
    setSelectedNote(null);
    setEditId(null);
    setTitle('');
    setNote('');
    setViewMode('create');
    setIsMenuOpen(false);
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
      <div style={{ padding: '20px', color: 'white', maxWidth: '400px', margin: '30px auto', textAlign: 'center' }}>
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
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .full-view-panel {
          animation: fadeIn 0.2s ease-in-out forwards;
        }
        .logout-btn {
          background-color: #ff4d4d;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }
        .menu-btn {
          background-color: #333;
          color: white;
          border: 1px solid #555;
          padding: 8px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Slide Drawer / Overlay CSS */
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999;
          display: ${isMenuOpen ? 'block' : 'none'};
        }
        .drawer-content {
          position: fixed;
          top: 0;
          left: ${isMenuOpen ? '0' : '-320px'};
          width: 300px;
          height: 100vh;
          background-color: #181818;
          padding: 20px;
          box-sizing: border-box;
          z-index: 10000;
          transition: left 0.3s ease-in-out;
          box-shadow: 2px 0 10px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
          padding: 20px;
          background-color: #121212;
          overflow-y: auto;
        }
      `}</style>

      {/* Top Navbar Menu Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#1f1f1f', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="menu-btn" onClick={() => setIsMenuOpen(true)}>
            ☰ <span>Menu</span>
          </button>
          <h2 style={{ fontSize: '18px', margin: 0 }}>NOTES SAVIOR</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#bbb' }}>{user.email}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout 🚪
          </button>
        </div>
      </div>

      {/* Menu Overlay */}
      <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)}></div>

      {/* Drawer Menu */}
      <div className="drawer-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#4CAF50' }}>📁 Saved Notes Menu</h3>
          <button 
            onClick={() => setIsMenuOpen(false)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
          >
            ✖
          </button>
        </div>

        <button 
          onClick={handleCreateNewClick}
          style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
        >
          + Create New Note
        </button>

        <input 
          type="text" 
          placeholder="🔍 Search notes..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ padding: '10px', width: '100%', borderRadius: '5px', marginBottom: '15px', boxSizing: 'border-box', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444' }} 
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
          {filteredNotes.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No notes found.</p>
          ) : (
            filteredNotes.map((item) => {
              const isSelected = selectedNote?.id === item.id && viewMode === 'view';
              return (
                <button 
                  key={item.id} 
                  onClick={() => handleNoteClick(item)}
                  style={{ 
                    padding: '12px', 
                    borderRadius: '6px', 
                    backgroundColor: isSelected ? '#007bff' : '#262626',
                    color: '#ffffff',
                    border: isSelected ? '1px solid #0056b3' : '1px solid #333',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    outline: 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#383838';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.borderColor = '#007bff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#262626';
                      e.currentTarget.style.transform = 'translateX(0px)';
                      e.currentTarget.style.borderColor = '#333';
                    }
                  }}
                >
                  <span 
                    style={{ 
                      flex: 1, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: '14px'
                    }}
                  >
                    📝 {item.title || 'Untitled'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <DeveloperContact />
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        
        {/* View Mode */}
        {viewMode === 'view' && selectedNote && (
          <div className="full-view-panel" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
            
            <button 
              onClick={handleCreateNewClick}
              style={{ backgroundColor: '#444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px', fontWeight: 'bold' }}
            >
              ➕ Create New Note
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ margin: 0, color: '#fff', wordBreak: 'break-word', fontSize: '22px' }}>{selectedNote.title}</h2>
              <span style={{ fontSize: '12px', color: '#17a2b8', backgroundColor: '#0e2a30', padding: '4px 8px', borderRadius: '4px' }}>Opened Note</span>
            </div>
            
            <div style={{ 
              minHeight: '200px',
              maxHeight: '60vh', 
              overflowY: 'auto', 
              backgroundColor: '#181818', 
              padding: '15px', 
              borderRadius: '5px',
              border: '1px solid #333'
            }}>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#ddd', whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>
                {selectedNote.note}
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333', flexWrap: 'wrap', gap: '10px' }}>
              <small style={{ color: '#888' }}>Created: {selectedNote.createdAt}</small>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleEditClick(selectedNote)} style={{ backgroundColor: '#FF9800', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDeleteNote(selectedNote.id)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Form Mode */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
            
            {viewMode === 'edit' && (
              <button 
                onClick={handleCancelEdit}
                style={{ backgroundColor: '#444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px', fontWeight: 'bold' }}
              >
                ⬅ Cancel Edit
              </button>
            )}

            <h3>{viewMode === 'edit' ? '✏️ Edit Note' : '➕ Add New Note'}</h3>
            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                placeholder="Note Title..." 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                style={{ padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', width: '100%', boxSizing: 'border-box' }} 
              />
              <textarea 
                placeholder="Write your note here..." 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                rows="8" 
                style={{ padding: '12px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', width: '100%', boxSizing: 'border-box' }} 
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
  );
}

export default App;