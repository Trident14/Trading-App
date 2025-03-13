# **Trading Platform API Documentation**

## **Overview**
This is a sports trading platform that allows users to place bets on live events such as football, basketball, tennis, and cricket. The platform provides real-time score updates and dynamically adjusts odds based on the scores. Additionally, it features event and trade management, user authentication, and WebSocket integration for real-time notifications.

---
## Future Scope

### 1. **Frontend Development**
   - Build a sleek, user-friendly frontend using **React.js** and **Tailwind CSS**.
   - The frontend will include:
     - User Registration/Login Page
     - Dashboard for Users and Admin (Role-based)
     - Live Event Feed with real-time updates
     - Trade Management Interface (Place and Track Trades)
     - Event Management for Admin (Create, Update, Delete Events)
   
### 2. **Real-Time Trading with Live API Integration**
   - Integrate **real sports event APIs** for live score updates, odds, and event data.
   - Utilize **WebSockets** to push live updates to the frontend, including score changes and trade status updates.

### 3. **Payment Gateway Integration**
   - Implement **payment gateway integration** (e.g., Stripe, PayPal) to handle payment-related operations.
   - Users will be able to deposit funds, place bets, and withdraw winnings securely through the payment system.
   
### 4. **Low-Latency Server Using C++**
   - Develop a **low-latency server** in **C++** to manage trading operations efficiently.
   - The server will ensure fast processing of user requests and real-time score updates, improving overall platform performance.

### 5. **Multithreading for Optimized Trading Operations**
   - Utilize **multithreading** in C++ to ensure high-speed and optimized performance for handling trades.
   - This approach will minimize latency and maximize throughput, allowing the system to handle high-volume trading efficiently.
   - Multithreading will also be used to manage real-time updates for scores and trade settlements concurrently without affecting performance.

### 6. **Scalability & Performance Optimization**
   - Design the system to handle high traffic loads and ensure that it scales as the user base grows.
   - Implement database optimization techniques, such as indexing, caching, and efficient data retrieval methods, to handle large datasets in real-time.

## **Tech Stack**
- **Backend:** Node.js with Express.js
- **Database:** MongoDB
- **Authentication:** JWT-based authentication
- **WebSockets:** Socket.IO for real-time updates
- **Logging:** Winston for error and information logging
- **Environment Variables:** dotenv for configuration

---

### **Mock API for New Events**
- The update feature simulates real-world scenarios where the score updates and odds change based on the game’s progression. There is a 15% chance that the game will end with the current odds and score, reflecting the uncertainty of the event's outcome.
- The admin can trigger the `mockEvent` API, which generates a new event with an initial score and odds. The admin can also settle the event. Based on the trade or bet, the user will either receive a refund or lose their wager. Additionally, the admin can trigger score and odds updates during the event.

### **Atomicity and Efficiency**
- The API ensures race conditions are avoided by using atomic operations in MongoDB, such as `$inc` for incrementing values and `bulkWrite` operations for batch updates.
- **Indexed Fields:** Critical fields (e.g., `eventId`) are indexed to optimize read performance, especially for searches and updates.

---

## **Optimizations and Race Condition Avoidance in Trade System**

### 1. **Atomic Transactions with MongoDB**
   - **Feature**: The `placeTrade` function uses MongoDB's **transactions** to ensure that all database operations occur atomically.
   - **Explanation**: 
     - A session is started with `mongoose.startSession()` and `session.startTransaction()`, which ensures that if any part of the trade process fails (e.g., insufficient balance, event not found), all changes to the database are rolled back to maintain data integrity.
     - This approach prevents partial updates, such as deducting the balance without recording the trade, or updating the trade without deducting the balance, which could result in inconsistent states or race conditions.

### 2. **Race Condition Prevention with Sufficient Balance Check**
   - **Feature**: The code ensures that the user’s balance is checked both before the trade and atomically during the trade deduction.
   - **Explanation**: 
     - Before updating the user's balance, the condition `{ _id: userId, balance: { $gte: betAmount } }` is used to ensure that the balance is checked again in the same transaction. This prevents other processes from deducting the balance between the trade attempt and the update operation.
     - **Race condition example**: Without this check, another process might reduce the user's balance between when it’s first checked and the transaction commit, causing the trade to execute without sufficient funds.

### 3. **Use of Bulk Write Operations for Efficiency**
   - **Feature**: The settlement process (`settleTrades`) uses **bulk write operations** with `User.bulkWrite()` and `Trade.bulkWrite()`.
   - **Explanation**: 
     - By performing multiple updates in one operation (batching them together), the application avoids making multiple database calls, reducing network overhead and improving the system's efficiency.
     - For example, updating user balances and trade statuses in bulk rather than iterating over each record with individual operations.

### 4. **Session-based Operations for Isolation**
   - **Feature**: The code uses **MongoDB sessions** to ensure that the operations on the `User`, `Trade`, and `Event` collections are isolated and executed within a single transaction.
   - **Explanation**:
     - By performing all database operations (e.g., fetching the user, deducting the balance, creating or updating trades) within the same session, the system avoids conflicting reads and writes during the transaction. This isolation prevents race conditions, where multiple requests could conflict with each other and produce inconsistent or incorrect results.

### 5. **Validation and Early Exits**
   - **Feature**: **Early validation checks** prevent unnecessary operations.
   - **Explanation**:
     - For instance, if the event is not found, the function exits early, aborting the transaction. This saves resources and ensures that invalid operations (such as placing a bet on a non-existent event) do not occur, avoiding potential race conditions related to invalid data.
     - Similarly, the check for the event status ensures that bets are only placed on upcoming events, which prevents users from betting on completed or ongoing events, reducing unnecessary database load and preventing erroneous trades.

### 6. **WebSocket Notifications and Room Cleanup**
   - **Feature**: The system uses **WebSockets** for real-time notifications, such as when trades are placed or settled.
   - **Explanation**:
     - Real-time communication via WebSockets ensures that the frontend stays in sync with the backend, making the application more responsive.
     - After a trade is settled or a draw is detected, the event-related WebSocket room is cleaned up with `io.socketsLeave(eventId)`, ensuring that users no longer receive updates after the event is concluded. This prevents unnecessary WebSocket traffic and optimizes resource usage.

### 7. **Logging and Error Handling**
   - **Feature**: Comprehensive **logging** and error handling throughout the trade process.
   - **Explanation**:
     - Every critical operation (e.g., placing a trade, settling trades, balance checks) is logged with relevant details to aid in debugging and understanding the flow of actions. For example, if the system fails, the logs provide context on which step failed (e.g., "Insufficient balance", "Event not found").
     - If an error occurs, the transaction is aborted with `await session.abortTransaction()` to roll back any changes and maintain consistency.

### 8. **Handling Draw Outcomes**
   - **Feature**: The code has a **draw handling mechanism** that refunds all pending trades when the event ends in a draw.
   - **Explanation**:
     - All trades related to the event are refunded in bulk using `bulkWrite`, reducing the overhead of processing each trade individually.
     - This ensures that no user is left with an unsettled trade, preventing conflicts between the expected outcome and the system’s state, and ensuring data consistency.

---


This approach ensures that the platform can handle a high volume of transactions and updates without running into inconsistencies or performance issues.

