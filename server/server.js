import path from 'path';
import express from 'express';

// Application (express).
const app = express();
// Port of the server.
const port = process.env.PORT || 3000;
// Public path.
const publicPath = path.join(__dirname, '../public');
// Use public path.
app.use(express.static(publicPath));

/*

    ROUTES GO HERE.

*/


app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});