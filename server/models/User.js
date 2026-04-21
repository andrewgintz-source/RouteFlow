const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  created_at: { type: Date, default: Date.now },
  subscription: {
    plan:                { type: String, enum: ['monthly', 'yearly', null], default: null },
    status:              { type: String, enum: ['trialing', 'active', 'canceled', 'none'], default: 'none' },
    trial_end_date:      { type: Date, default: null },
    stripe_customer_id:  { type: String, default: null },
    stripe_subscription_id: { type: String, default: null }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
