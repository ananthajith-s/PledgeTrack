const mongoose = require('mongoose');

const pledgeSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Pledge must belong to a donor']
  },
  
  amount: {
    type: Number,
    required: [true, 'Please provide pledge amount'],
    min: [1, 'Pledge amount must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Amount must be an integer'
    }
  },
  
  purpose: {
    type: String,
    required: [true, 'Please provide pledge purpose'],
    trim: true,
    maxlength: [500, 'Purpose cannot be more than 500 characters']
  },
  
  status: {
    type: String,
    enum: ['pending', 'partial', 'fulfilled'],
    default: 'pending'
  },
  
  // Store paid amount separately for easier calculations
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  
  // Store remaining amount for faster queries
  remainingAmount: {
    type: Number,
    default: function() {
      return this.amount;
    },
    min: [0, 'Remaining amount cannot be negative']
  }
}, {
  timestamps: true
});

// Update remaining amount whenever paidAmount changes
pledgeSchema.pre('save', function(next) {
  this.remainingAmount = this.amount - this.paidAmount;
  
  // Update status based on payment
  if (this.remainingAmount <= 0) {
    this.status = 'fulfilled';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
  
  next();
});

module.exports = mongoose.model('Pledge', pledgeSchema);