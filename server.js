import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

//initialize app data
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//set up EJS to hold the HTML code
app.set("view engine", "ejs");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("views", path.join(__dirname, "views"));

// Database data
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BlogDB",
  password: "BozleyMilo263",
  port: 5432,
});

db.connect()
  .then(() => console.log("Connected to DB :)"))
  .catch((err) => console.error("ERROR: Problem connecting to DB :(", err));


// handle sign up operation
app.post("/api/signup", async (request, response) => {
  var { user_id, name, password } = request.body;
  var userFlag = await db.query("SELECT * FROM users WHERE user_id = $1", [user_id]);

  // check for user data already taken
  if (userFlag.rows.length > 0)
  {
    return response.json({ error: "Look's like that user already exists!" });
  }

  // oherwise assume success and add user to DB
  await db.query( "INSERT INTO users (user_id, name, password) VALUES ($1, $2, $3)", [user_id, name, password]);
  response.json({ success: true });
});



// handle sign in operation
app.post("/api/signin", async (request, response) => {
  var { user_id, password } = request.body;

  // check if user is in DB
  var user = await db.query( "SELECT * FROM users WHERE user_id = $1 AND password = $2", [user_id, password] );

  //check for correct input
  if( user.rows.length === 0 )
  {
    return response.json({ error: "Uh Oh... Something is off!" });
  }
  // otherwise assume correct and return success
  response.json({ name: user.rows[0].name, user_id: user.rows[0].user_id });
});



// get all posts operation
app.get("/api/blogs", async (request, response) => {
  // collect post data
  var posts = await db.query("SELECT * FROM blogs ORDER BY date_created DESC");
  response.json({ blogs: posts.rows });
});



// handle post creation
app.post("/create", async (request, response) => {
  var { creator_name, creator_user_id, title, body } = request.body;

  // attempt to insert new post data into the DB
  await db.query("INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES ($1, $2, $3, $4, NOW())", [creator_name, creator_user_id, title, body] );
  var newPosts = await db.query("SELECT * FROM blogs ORDER BY date_created DESC");
  response.json({ blogs: newPosts.rows });
});


// handle delete operation
app.post("/deletePost/:id", async (request, response) => {
  var { id } = request.params;
  // var { user_id } = request.query;

  // delete the selected post assume front end logic blocks users from editng non-authored posts
   await db.query("DELETE FROM blogs WHERE blog_id = $1", [id]);
   response.json({ success: true });
});


// handle get operation for edit
app.get("/editPost/:id", async (request, response) => {
  var { id } = request.params;

  // get the post data
  const postData = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [id]);
  var post = postData.rows[0];

  //return the post data of the desired post
  // assume front end logic prevents non-author users from seeing the button to edit
  response.json({ post });
});


// handle post update
app.post("/editPost/:id", async (request, response) => {
  // collect post data
  var { id } = request.params;
  var { user_id } = request.body;
  var { title, body } = request.body;

  // assume front-end logic blocks non-author users from seeing the edit button
  await db.query("UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3",[title, body, id]);
  response.redirect(`/blogs?user_id=${user_id}`);
});


//display posts page
app.get("/blogs", async (request, response) => {
  var { user_id } = request.query;
  var postData = await db.query("SELECT * FROM blogs ORDER BY date_created DESC");
  response.json({ posts: postData.rows, user_id });
});

// handle initial page direction
app.get("/", (request, response) => {
  response.render("index");
});

// start listening
app.listen(3000, () => console.log("Server @: http://localhost:3000"));