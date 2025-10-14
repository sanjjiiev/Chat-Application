# 🎓 Campus Connect

**Campus Connect** is a full-featured social platform built for university students using the **MERN stack (MongoDB, Express.js, React.js, Node.js)**.  
It allows students to **connect, post updates, join discussions, and collaborate** on campus activities — similar to Reddit, but tailored for your university community.

---

##  Features

###  User System
- **Signup / Login** using university email credentials  
- **Secure authentication** with password hashing and JWT  
- **Profile page** displaying user details  

###  Home Feed
- Displays all posts from students  
- **Upvote / Downvote** system for engagement  
- **Comment** on posts and participate in discussions  

###  Post Management
- Create text or media-based posts  
- Filter posts by **topics, departments, or popularity**  
- Edit or delete your own posts  

###  Chat Groups 
- Predefined room categories: *Study Groups, Events, Courses, Clubs, General*
- Join/Leave functionality with membership validation
- Admin-controlled moderation system
- Room participation statistics and pie chart visualization
- Real-time chat powered by **Socket.io**

###  Search & Discovery
- Search for people by **name or role** (e.g. “Club President”, “Volunteer”)  
- Explore trending topics or discussions

---

##  Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React.js, Tailwind CSS, Chart.js / Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | JWT, bcrypt |
| Real-time Chat | Socket.io |

---

##  Installation and Setup

Follow these steps to run the project locally 

### 1️ Clone the Repository
```bash
git clone https://github.com/<your-username>/campus-connect.git
cd campus-connect

2️ Backend Setup

cd backend
npm install

Create a .env file in the backend folder:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

Run the backend:

npm start

3️ Frontend Setup

cd ../frontend
npm install
npm start

The app should now be running at:

Frontend → http://localhost:3000  
Backend  → http://localhost:5000
