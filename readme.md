npm init -y
npm install three
npm install -D parcel

npm run start

while running the rest api using python api.py command on another terminal

template

{
"name": "naturemorte",
"version": "1.0.0",
"description": "",
"main": "index.js",
"scripts": {
"test": "echo \"Error: no test specified\" && exit 1",
"start": "parcel naturemorte/index.html",
"build": "parcel build naturemorte/index.html"
},
"keywords": [],
"author": "",
"license": "ISC",
"dependencies": {
"three": "^0.162.0"
},
"devDependencies": {
"parcel": "^2.12.0"
}
}
