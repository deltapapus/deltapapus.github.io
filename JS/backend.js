// Mostrar usuario y controlar visibilidad
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('user-info');
const forumContent = document.getElementById('forum-content');

logoutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
	if (user) {
		document.getElementById('loginBtn').style.display = 'none';
		logoutBtn.style.display = '';
		userInfo.textContent = `Hola, ${user.email}`;
		forumContent.style.display = '';
	} else {
		document.getElementById('loginBtn').style.display = '';
		logoutBtn.style.display = 'none';
		userInfo.textContent = '';
		forumContent.style.display = 'none';
	}
});
// Inicializa Firebase
const firebaseConfig = {
	apiKey: "AIzaSyDt7YQ72Ksx7r8qkhe_Ja3yEIruy2bdZD4",
	authDomain: "deltapapusdev.firebaseapp.com",
	projectId: "deltapapusdev",
	storageBucket: "deltapapusdev.appspot.com",
	messagingSenderId: "817602369970",
	appId: "1:817602369970:web:563cb5398499ed48232cab"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Login por correo y contraseña
document.getElementById('loginBtn').onclick = async () => {
	const email = document.getElementById('loginEmail').value.trim();
	const password = document.getElementById('loginPassword').value;
	if (!email || !password) {
		alert('Ingresa correo y contraseña');
		return;
	}
	try {
		await auth.signInWithEmailAndPassword(email, password);
		alert('¡Sesión iniciada!');
	} catch (err) {
		alert('Error: ' + err.message);
	}
};
