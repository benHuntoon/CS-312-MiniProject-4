// set REACT core function
function App() {
  // set signup as landing page and defaultt user before log in
  const [page, setPage] = React.useState("signup");
  const [form, setForm] = React.useState({ user_id: "", name: "", password: "" });
  const [error, setError] = React.useState("");
  const [currentUser, setCurrentUser] = React.useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // signup sub function
  const handleSignup = async () => {
    // set error type to default
    setError("");
    var response = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form), });
    var signupResult = await response.json();

    // check for valid new user
    if( signupResult.error )
    {
        // set error
        return setError( signupResult.error );
    }
    // otherwise reset user settigns for sign in page
    setForm({ user_id: "", name: "", password: "" });
    // update page
    setPage("signin");
  };

  // sign in sub function
  const handleSignin = async () => {
    // set error type to default
    setError("");
    var response = await fetch("/api/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form), });
    var signInFlag = await response.json();

    // check for sign in valid
    if( signInFlag.error )
    {
        //display error
        return setError(signInFlag.error);
    }

    // set the user settings to sign in data
    setCurrentUser({ name: signInFlag.name, user_id: signInFlag.user_id });
    // update page entry data
    setForm({ user_id: "", name: "", password: "" });
  };


  //display sign up pages
  if (!currentUser) {
    if (page === "signup") 
    {
      return (
        <div className="container">
          <h1>Sign up!</h1>
          {error && <h2 style={{ color: "red" }}>{error}</h2>}
          <input name="user_id" placeholder="User ID" value={form.user_id} onChange={handleChange} />
          <input name="name" placeholder="Display Name" value={form.name} onChange={handleChange} />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
          <button onClick={handleSignup}>Sign Up</button>
          <p>
            Already have an account?{" "}
            <strong style={{ cursor: "pointer" }} onClick={() => setPage("signin")}>Sign In</strong>
          </p>
        </div>
      );
    } 
    // otherwise assume signing in
    else if (page === "signin") 
    {
      return (
        <div className="container">
          <h1>Sign In</h1>
          {error && <h2 style={{ color: "red" }}>{error}</h2>}
          <input name="user_id" placeholder="User ID" value={form.user_id} onChange={handleChange} />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
          <button onClick={handleSignin}>Sign In</button>
          <p>
            Need an account?{" "}
            <strong style={{ cursor: "pointer" }} onClick={() => setPage("signup")}>Sign Up</strong>
          </p>
        </div>
      );
    }
  }

  // once signed in display the main blog page
  return <PostList currentUser={currentUser} />;
}


// initialize the blog post display list
function PostList({ currentUser }) {
  // set post display data to defaults
  const [posts, setPosts] = React.useState([]);
  const [newPost, setNewPost] = React.useState({ title: "", body: "" });
  const [error, setError] = React.useState("");

  // collect the post data from the DB
  const fetchPosts = () => {
    fetch("/api/blogs")
      .then((response) => response.json())
      .then((postData) => {
        if (postData.blogs) 
        {
            setPosts(postData.blogs);
        }
      });
  };

  // display the posts
  React.useEffect(() => { fetchPosts();}, []);



  //handle page update sub function
  const handleChange = (event) => setNewPost({ ...newPost, [event.target.name]: event.target.value });

  // post creation sub function
  const handleCreatePost = async (event) => {
    // initialize event data
    event.preventDefault();
    setError("");

    var response = await fetch("/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPost.title,
          body: newPost.body,
          creator_name: currentUser.name,
          creator_user_id: currentUser.user_id,
        }),
      });

    // check for valid creation of post
    if( response.ok )
    {
        // handle new psot addition
        fetchPosts();
        setNewPost({ title: "", body: "" });
    }

    if (!newPost.title || !newPost.body) {
      setError("Title and body are required.");
      return;
    }
  };


  // handle delete post
  const handleDelete = async (postId, postUserId) => {
    // assume front end logic prevents non author users from deleting posts
    var response = await fetch(`/deletePost/${postId}?user_id=${currentUser.user_id}`, { method: "POST" });

    // attempt to delete the post
    if( response.ok )
    {
        // update the displayed posts
        fetchPosts();
    }
    // otherwise listen for errors
    else
    {
        alert(await response.text());
    }
  };


  // handle edit post
  const handleEdit = async (postId) => {
    // collect selected post data
    var response = await fetch(`/editPost/${postId}?user_id=${currentUser.user_id}`);
    var postData = await response.json();

    // check for selection error
    if( postData.error )
    {
        // display the error
        return alert(data.error);
    }

    // prompt the user for new title and text
    var newTitle = prompt("Edit title", postData.post.title);
    var newBody = prompt("Edit body", postData.post.body);

    // update the DB and displayed posts
    if( newTitle && newBody )
    {
        // update the JSON
        await fetch(`/editPost/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.user_id,
            title: newTitle,
            body: newBody,
          }),
        });

        // update the displayed posts
        fetchPosts();
    }
  };

  // handle display of DOM data
  return (
    <div className="container">
      <h1>Welcome, {currentUser.name}!</h1>

      {/* Create new post */}
      <div className="new-post">
        <h2>Share what you're thinking!</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleCreatePost}>
          <input
            name="title"
            placeholder="Post Title"
            value={newPost.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="body"
            placeholder="Write something..."
            value={newPost.body}
            onChange={handleChange}
            required
          ></textarea>
          <button type="submit">Post</button>
        </form>
      </div>

      {/* handle existing post case */}
      {posts.length === 0 ? (
        <p>No posts yet... :(</p>
      ) : (
        posts.map((post) => (
          <div key={post.blog_id} className="post">
            <h3>{post.title}</h3>
            <p>{post.body}</p>
            <small>by {post.creator_name} - {new Date(post.date_created).toLocaleString()}</small>
            {/* check to verify only author can edit / remove post */}
            {post.creator_user_id === currentUser.user_id && (
              <div className="post-actions">
                <button onClick={() => handleEdit(post.blog_id)}>Edit</button>
                <button onClick={() => handleDelete(post.blog_id, post.creator_user_id)}>Delete</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// link the set posts to the DOM in the index view
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
