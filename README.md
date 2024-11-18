# SyncZone
SyncZone or synchronizing timezone, aims to meet the needs of users who struggle to stay connected with loved ones living far away. The main focus of our project is to bridge the communication gap by offering features that help users connect emotionally and practically. Whether through sending positive messages, better recognizing emotions, or scheduling important dates, SyncZone helps users manage the challenges posed by different time zones, ensuring that distance doesn't hinder meaningful relationships.

This repository contains the code for the SyncZone mobile app, built with React Native for the frontend and Supabase for the backend. The app allows users to chat in real-time, send messages, and schedule events while integrating user authentication and more.

# Repository Structure
**/frontend:** Contains the React Native code for the mobile app.

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
REACT_APP_SUPABASE_URL=https://your-supabase-url.supabase.co
REACT_APP_ANON_KEY=your-supabase-anon-key
HUME_WS_URL=wss://api.hume.ai/v0/stream/models
HUME_API_KEY=your-hume-api-key
API_KEY=your-weather-api-key
API_URL=https://api.weatherapi.com/v1/current.json


**screens folder**
Contains screens

**assets folder**
Contains app images

**components folder**
Contains React Native components

**node_modules folder**
Contains all npm dependencies files. Ignored by Git & GitHub

# Usage
Fork the repository and create a new branch for your feature or bug fix.

Ensure that your code follows the project's coding standards.

Submit a pull request with a detailed description of your changes.