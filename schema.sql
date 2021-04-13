DROP TABLE IF EXISTS book_app;
CREATE TABLE book_app (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  author VARCHAR(255),
  description TEXT,
  image VARCHAR(225)
);