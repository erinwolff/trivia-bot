// Error handling 

module.exports = function errorHandlers() {
  process.on('uncaughtException', (err) => {
    console.error('An uncaught exception occurred:', err);
    process.exit(1); // Exit the process with a failure code
  });
}