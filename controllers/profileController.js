// controllers/profileController.js

exports.getProfile = async (req, res) => {
  res.render("profile", {
    username: req.session.username || "User",
    email: req.session.email || "user@example.com"
  });
};

exports.updateProfile = async (req, res) => {
  res.send("Update profile");
};

exports.changePassword = async (req, res) => {
  res.send("Change password");
};

exports.deleteAccount = async (req, res) => {
  res.send("Delete account");
};
