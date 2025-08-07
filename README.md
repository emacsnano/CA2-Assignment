# DBS

## Setup

1. Clone this repository

2. Create a .env file with the following content

    ```
    DB_USER=
    DB_PASSWORD=
    DB_HOST=
    DB_DATABASE=
    DB_CONNECTION_LIMIT=1
    PORT=3000
    ```

3. Update the .env content with your own database credentials.

4. Install dependencies by running `npm install`

5. Start the app by running `npm start`. Alternatively to use hot reload, start the app by running `npm run dev`.

6. You should see `App listening on port 3000`

8. (Optional) install the plugins recommended in `.vscode/extensions.json`

## Instructions

Open the page, `http://localhost:3000`, replace the port number accordingly if you app is not listening to port 3000

## To Run The Project
npm start or npm run dev (nodemon) in the terminal

## Review MVC
reviews.js (route) -> reviewsController.js (controller) -> reviews.js (model)

## Comment MVC
comments.js (route) -> commentsController.js (controller) -> comments.js (model)

## Admin Dashboard MVC
saleOrders.js (route) -> saleOrdersController.js (controller) -> saleOrders.js (model)

## Remarks
1. Line 22 - 115 of saleOrders.js (model) has code that is commented out because admin dashboard feature is not implemented successfully and keep giving a 304 error. An alternative solution has been used. This is kept just as a record.
2. Requirements for this project has been fulfilled but no additional features as I did not commit and lost all of my files so I have to redo everything again :(
3. Only one function for reviews, the rest is SQL Statements
4. To use the filter function of admin dashboard, select menu of Gender, Age Group and select option of Completed Orders, press Filter button to filter.