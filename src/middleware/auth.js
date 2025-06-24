const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // ✅ Safely check if cookies object exists
    const token = req.cookies?.token;

    if (!token) {
        console.warn("No token found, redirecting...");
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Invalid JWT:", error.message);
        return res.redirect('/login');
    }
};

module.exports = auth;
