'use strict';

const express = require('express');
const pg = require('pg');

require('dotenv').config();

const cors = require('cors');

const server = express();

const superagent = require('superagent');

const PORT = process.env.PORT || 5000;
const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    // ssl:
    // {
    //     rejectUnauthorized: false
    // }
});

server.use(cors());

server.use(express.static('./public'));
server.use(express.urlencoded({ extended: true }));
server.get('/', getBook);
server.post('/addBook', addBookHandler);
server.get('/bookDetails/:bookID',getOneBookDetails);

server.set('view engine', 'ejs');


// server.get('/', (req, res) => {
//     res.render('pages/index');
// });

server.get('/searches/new', (req, res) => {
    res.render('pages/searches/new');
});

server.post('/searches', (req, res) => {
    let search = req.body.search;
    let term = req.body.intitle;
    let url = `https://www.googleapis.com/books/v1/volumes?q=+${term}:${search}`;
    superagent.get(url)
        .then(data => {
            let books = data.body.items.map(book => new Book(book));
            console.log(books);
            res.render('pages/searches/shows', { books: books });
        });
});

function addBookHandler(req, res) {
    console.log(req.body);
    let { title, author, description, image } = req.body;
    let SQL = `INSERT INTO book_app (title,description,contact,image) VALUES ($1,$2,$3,$4) RETURNING *;`;
    let safeValues = [title, author, description, image];
    client.query(SQL, safeValues)
        .then(result => {
            console.log(result.rows);

            res.redirect(`/bookDetails/${result.rows[0].id}`);
        });
}

function getBook(req, res) {
    let SQL = `SELECT * FROM book_app;`;
    client.query(SQL)
        .then(results => {
            res.render('pages/index', { book: results.rows });
        })
        .catch(err => {
            res.render('error', { error: err });
        });
}
function getOneBookDetails(req, res) {
    // get from DB task id =3
    console.log(req.params);
    let SQL = `SELECT * FROM book_app WHERE id=$1;`;
    let safeValue = [req.params.bookID];
    client.query(SQL, safeValue)
        .then(result => {
            console.log(result.rows);
            res.render('oneTask', { book: result.rows[0] });
        });
}

function Book(data) {
    this.title = data.volumeInfo.title;
    this.author = data.volumeInfo.authors;
    this.description = data.volumeInfo.description;
    this.image = (data.volumeInfo.imageLinks) ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';

}

server.get('*', (req, res) => {
    let errorObject = {
        status: 500,
        responseText: 'Sorry, something went wrong'
    };
    res.render('./pages/error', { errorObject });
});

client.connect()
    .then(() => {
        server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
    });


