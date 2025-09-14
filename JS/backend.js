  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

    // Configura tu Firebase aquí
    const firebaseConfig = {
      apiKey: "AIzaSyDt7YQ72Ksx7r8qkhe_Ja3yEIruy2bdZD4",
      authDomain: "deltapapusdev.firebaseapp.com",
      projectId: "deltapapusdev",
      storageBucket: "deltapapusdev.firebasestorage.app",
      messagingSenderId: "817602369970",
      appId: "1:817602369970:web:563cb5398499ed48232cab"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Login/Logout
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('user-info');
    const forumContent = document.getElementById('forum-content');

    loginBtn.onclick = async () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!email || !password) {
        alert('Ingresa correo y contraseña');
        return;
      }
      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };
  logoutBtn.onclick = () => auth.signOut();

    auth.onAuthStateChanged(user => {
      if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = '';
        userInfo.textContent = `Hola, ${user.email}`;
        forumContent.style.display = '';
        loadPosts();
      } else {
        loginBtn.style.display = '';
        logoutBtn.style.display = 'none';
        userInfo.textContent = '';
        forumContent.style.display = 'none';
      }
    });

    // Forum Post
    document.getElementById('postForm').onsubmit = async e => {
      e.preventDefault();
      const text = document.getElementById('postText').value.trim();
      if (!text) return;
      const user = auth.currentUser;
      await db.collection('forum-posts').add({
        text,
        user: user.displayName,
        uid: user.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      document.getElementById('postText').value = '';
      loadPosts();
    };

    // Load Posts
    async function loadPosts() {
      const postsList = document.getElementById('postsList');
      postsList.innerHTML = '';
      const snapshot = await db.collection('forum-posts').orderBy('timestamp', 'desc').limit(20).get();
      snapshot.forEach(doc => {
        const data = doc.data();
        const div = document.createElement('div');
        div.className = 'forum-post';
        div.innerHTML = `<b>${data.user}:</b> ${data.text} <span style="color:#888;font-size:0.9em;">${data.timestamp?.toDate().toLocaleString() || ''}</span>`;
        postsList.appendChild(div);
      });
    }