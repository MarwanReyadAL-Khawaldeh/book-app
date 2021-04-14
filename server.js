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
server.get('/',homePage);
server.post('/addBookHandler', addBookHandler);
server.get('/getOneBookDetails/:id', getOneBookDetails);

server.set('view engine', 'ejs');


function homePage(req, res) {

    let SQL = `Select * from books`;
    client.query(SQL)
        .then(result => {
            console.log(result.rows);
            res.render('pages/index', { book: result.rows });
        });
}

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
    let { title, author,isbn, img , description } = req.body;
    let SQL = `INSERT INTO books (title,author,isbn,img,description) VALUES ($1,$2,$3,$4,$5) RETURNING *;`;
    let safeValues = [title, author,isbn, img , description ];
    client.query(SQL, safeValues)
        .then(result => {
            console.log(result.rows);

            res.redirect(`/getOneBookDetails/${result.rows[0].id}`);
        });
}


function getOneBookDetails(req, res) {
    console.log(req.params);
    let SQL = `SELECT * FROM books WHERE id=$1;`;
    let safeValue = [req.params.id];
    client.query(SQL, safeValue)
        .then(result => {
            res.render('pages/book/detail', { books: result.rows[0] });
        });
}

function Book(data) {
    this.title = data.volumeInfo.title;
    this.author = data.volumeInfo.authors;
    this.description = data.volumeInfo.description;
    this.img = (data.volumeInfo.imageLinks) ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.isbn = (data.volumeInfo.industryIdentifiers)?data.volumeInfo.industryIdentifiers[0].identifier : 'ISBN N/A' ;
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


