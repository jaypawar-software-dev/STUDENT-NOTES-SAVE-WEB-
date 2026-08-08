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
      setEmail(''); setPassword('');
    } catch (error) { alert(error.message); }
  };

  const handleLogout = () => signOut(auth);

  const fetchNotes = async (userId) => {
    const q = query(collection(db, 'student_notes'), where('userId', '==', userId));
    const data = await getDocs(q);
    setNotesList(data.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title || !note) return alert('Please enter title and note!');
    if (editId) {
      await updateDoc(doc(db, 'student_notes',
         editId),
          { title, note });


      setEditId(null);
    } else {
      await addDoc(collection(db, 'student_notes'),
       { title, note, userId: user.uid,
        userEmail: user.email || 'No Email',
         createdAt: new Date().
         toLocaleDateString() });
    }
    setTitle(''); setNote('');
    fetchNotes(user.uid);
  };

  const handleDeleteNote = async (id) => {
    await deleteDoc(doc(db, 'student_notes', id));
    fetchNotes(user.uid);
  };

  const handleEditClick = (item) => {
    setEditId(item.id); setTitle(item.title); setNote(item.note);
  };

  const filteredNotes = notesList.filter((item) => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DeveloperContact = () => (
    <div style={{ marginTop: '40px',
     paddingTop: '15px',
      borderTop: '1px solid #444',
       textAlign: 'center', 
       fontSize: '14px',
        color: '#aaa' }}>


      <p style={{ margin: '5px 0',
         fontWeight: 'bold', 
         color: '#ddd' }}
          >Need Help or Facing Issues?</p>


      <p style={{ margin: '5px 0' }}
      >Developer: <span style={{ color: '#fff',
       fontWeight: 'bold' }}
       >Jay Pawar</span></p>

      <p style={{ margin: '5px 0' }} >Email: <a href="mailto:jaypawar8399@gmail.com" 
      style={{ color: '#4CAF50', 
      textDecoration: 'none' }} >jaypawar8399@gmail.com</a></p>

      <p style={{ margin: '5px 0' }}>Contact: <a href="tel:8317289128"
       style={{ color: '#4CAF50', textDecoration: 'none' }}>+91 8317289128</a></p>
    </div>
  );

  
  if (!user) {
    return (
      <div style={
        { padding: '30px', color: 'white', maxWidth: '400px', margin: '30px auto', textAlign: 'center' }}>

        <h2>{isRegistering ? 'Register' : 'Login'}</h2>

        <form onSubmit={handleAuth} 
        style={
          { display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
          <input type="email" placeholder="Email..." value={email} onChange={(e) => setEmail(e.target.value)}
           required style={
            { padding: '10px', borderRadius: '5px' }} />

          <input type="password" placeholder="Password..." value={password} onChange={(e) => setPassword(e.target.value)}
           required style={
            { padding: '10px', borderRadius: '5px' }} />
            
          <button type="submit" 
          style={
            { padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
              {isRegistering ? 'Create Account' : 'Login'}</button>
        </form>

        <p style={
          { marginTop: '15px', cursor: 'pointer', color: '#4CAF50' }}
           onClick={() => setIsRegistering(!isRegistering)}>

          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
        <DeveloperContact />
      </div>
    );
  }

  return (
    <div style={
      { padding: '30px', color: 'white', maxWidth: '600px', margin: '0 auto' }}>

      <div style={
        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>

        <span>Welcome, {user.email}</span>
        
        <button onClick={handleLogout} style={
          { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px' }}>Logout</button>
      </div>

      <h1 style={
        { textAlign: 'center' }}>Student Notes Save App</h1>
      <form onSubmit={handleSaveNote} style={
        { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>

        <input type="text" placeholder="Note Title..." value={title} onChange={(e) => setTitle(e.target.value)} 
        style={
          { padding: '10px', borderRadius: '5px' }} />

        <textarea placeholder="Write your note here..." value={note} onChange={(e) => setNote(e.target.value)} rows="4" 
        style={
          { padding: '10px', borderRadius: '5px' }} />
        <button type="submit" 
        style={
          { padding: '10px', backgroundColor: editId ? '#FF9800' : '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>{editId ? 'Update Note' : 'Save Note'}</button>
      </form>

      <input type="text" placeholder="🔍 Search notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
      style={
        { padding: '10px', width: '100%', borderRadius: '5px', marginBottom: '25px', boxSizing: 'border-box' }} />
      <h2>Saved Notes</h2>

      <div style={
        { display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredNotes.map((item) => (
          <div key={item.id} 
          style={
            { backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
            <h3>{item.title}</h3>
            <p>{item.note}</p>

            <div style={
              { display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => handleEditClick(item)} 
              style={
                { backgroundColor: '#FF9800', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px' }}>Edit</button>
              <button onClick={() => handleDeleteNote(item.id)} 
              style={
                { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <DeveloperContact />
    </div>
  );
}

export default App;