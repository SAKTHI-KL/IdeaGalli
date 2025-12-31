const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String, index: true },
  message: { type: String },
  source: { type: String, default: 'website' },
  language: { type: String, default: 'en' },
  metadata: { type: Object },
  notifiedSlack: { type: Boolean, default: false },
  notifiedEmail: { type: Boolean, default: false },
  handled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
