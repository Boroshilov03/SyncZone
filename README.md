# SyncZone
This repository contains the code for the Chat App, which includes both the frontend (React Native) and the backend (Django). This app allows users to chat in real-time and includes features like user authentication, real-time messaging, schedule planner and more.

# Repository Structure
**/frontend:** Contains the React Native code for the mobile app.

**/backend:** Contains the Django code for the backend server.

# Frontend Setup (React Native)
**Prerequisites:**
Node.js (v14 or later)
npm (v6 or later) or Yarn
React Native CLI
Android Studio or Xcode (for mobile emulators)

**Installation:**
cd frontend
npm install
**or if you use Yarn**
yarn install

**Running the App:**
iOS: Open frontend/ios/ChatApp.xcworkspace in Xcode and run the project.
Android: Run the following command:
npm run android
**or if you use Yarn**
yarn android

**Configuration:**
Create a .env file in the frontend directory with the following variables:
API_URL=http://localhost:8000/api
Backend Setup (Django)

# Backend Setup (Python/Django)
**Prerequisites:**
Python 3.8 or later
pip (Python package manager)
Virtualenv

**Installation:**
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt

# Database Setup:

Ensure MySQL or your preferred database is running.
Create a .env file in the backend directory with your database configuration:
DATABASE_URL=postgres://user:password...

# Running the Server:
python manage.py migrate

python manage.py runserver

# Admin Access:
Create a superuser to access the Django admin panel:
python manage.py createsuperuser
Dependencies

Frontend:
React Native
Axios (for API requests)
React Navigation

Backend:
Django
Django REST framework
psycopg2 (PostgreSQL adapter)
dotenv (for environment variables)

# Usage Guidelines
Use frontend for making changes to the React Native app.
Use backend for changes to the Django server.
Test changes locally before pushing to the repository.
Contributing:

Fork the repository and create a new branch for your feature or bug fix.
Ensure that your code follows the project's coding standards.
Submit a pull request with a detailed description of your changes.
Deployment:

Follow the deployment guidelines in the relevant branch documentation
