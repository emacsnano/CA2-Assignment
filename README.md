# DBS
## Remarks
### CA1
1. Line 22 - 115 of saleOrders.js (model) has code that is commented out because admin dashboard feature is not implemented successfully and keep giving a 304 error. An alternative solution has been used. This is kept just as a record.
2. Requirements for this project has been fulfilled but no additional features as I did not commit and lost all of my files so I have to redo everything again :(
3. Only one function for reviews, the rest is SQL Statements
4. To use the filter function of admin dashboard, select menu of Gender, Age Group and select option of Completed Orders, press Filter button to filter.

### CA2
1. place_order stored procedure is called place_order_stored_procedure.sql
2. Transaction have some issues with rollback
3. Cart CRUD functionality, stored_procedure and checkout is under cartController.js