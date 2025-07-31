make .env in both server and client folder. Paste the below content

server/.env
MONGO_URL=mongodb://127.0.0.1:27017/PAS-Agent
GEMINI_API_KEY=AIzaSyDmtT_TGBg82IMts5wbT4ohbnvFf8xAA70
PORT=5001
JASON_CALENDAR_ID=03d2d5cd12415b08357ec9293d7fb5f6acfd37e79c12a8a6d1071e4fcc52654d@group.calendar.google.com
ELIZABETH_CALENDAR_ID=916fa54fc623e06e876d138ec7edb2be7861f3bc1813e57893fc905f446136f7@group.calendar.google.com

client/.env
VITE_API_BASE_URL=http://localhost:5001

run npi i in both folder 
run server with npm start - cd server->npm start
run client with npm run dev - cd client-> npm run dev
