import bcrypt from 'bcrypt';
async function run() {
    const hash = '$2b$10$o45CtqZtDLwK89ZWNWxueuRu9sKTIujzY9vOjVcPoW80BUZWNDGI6';
    const isValid = await bcrypt.compare('password123', hash);
    console.log("Is password123 valid?", isValid);
}
run();
