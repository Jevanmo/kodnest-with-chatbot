const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'kodbank.db');
const db = new sqlite3.Database(dbPath);

// Function to update balances
function updateBalances() {
  // First, get all users
  db.all('SELECT cust_id, cust_name, email, balance FROM bank_users ORDER BY cust_id', [], (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      db.close();
      return;
    }

    if (users.length === 0) {
      console.log('No users found in the database.');
      db.close();
      return;
    }

    console.log(`Found ${users.length} user(s) in the database:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.cust_name} (${user.email}) - Current Balance: $${user.balance}`);
    });

    // Update balances for up to 3 users
    const balancesToAdd = [1000.00, 2500.00, 5000.00]; // You can modify these amounts
    
    console.log('\nUpdating balances...\n');

    let updateCount = 0;
    const maxUsers = Math.min(users.length, 3);

    users.slice(0, maxUsers).forEach((user, index) => {
      const newBalance = balancesToAdd[index] || 1000.00;
      
      db.run(
        'UPDATE bank_users SET balance = ? WHERE cust_id = ?',
        [newBalance, user.cust_id],
        function(err) {
          if (err) {
            console.error(`Error updating balance for ${user.cust_name}:`, err);
          } else {
            console.log(`✓ Updated ${user.cust_name} (${user.email}) balance to $${newBalance.toFixed(2)}`);
            updateCount++;
          }

          // Close database when all updates are done
          if (updateCount === maxUsers) {
            console.log(`\n✓ Successfully updated ${updateCount} user balance(s).`);
            db.close();
          }
        }
      );
    });

    if (users.length === 0) {
      db.close();
    }
  });
}

// Run the update
updateBalances();
