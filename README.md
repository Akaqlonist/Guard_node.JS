# VetGuard-Web
The web application for the VetGuard app

##Information
Domain: http://VetGuards.com/
<br>
Project Specs: https://drive.google.com/drive/folders/0Bw2bKdUtTCe8RFZjVzE4UWNvcnM?usp=sharing
<br>
<br>

##Pushing to Production
1. In main directory, run 'npm run clean', then run 'npm run build'
2. cd build
3. git add .
4. git commit -m 'message'
5. git push prod master -f

##SSL Issues
If you ever run into an issue running the app do to something regarding SSL. 
1. Go to config vars in heroku, retrieve the database url
2. In terminal, in your project directory, run export DATABASE_URL=\<databaseurl>
