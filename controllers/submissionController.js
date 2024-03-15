// controllers/authController.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Submission = require('../models/submissionModel')
var db = require('../config/db');
const { authenticateAndAuthorize } = require('../auth');

const router = express.Router();
router.use(bodyParser.json());

router.post('/attendee', (req, res) => {
    try{
  const io = require('../socket').getIo();
  // Assuming you have the necessary data in the request body
  const newAttendee = new Submission(req.body);
  newAttendee.postSubmission(io, res);
    } catch(error){
        console.error('Error sending submissions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/',authenticateAndAuthorize, async (req, res) => {
    
    try {
      // Get branch_id from the request body or query parameters
      const branchId = req.body.branch_id || req.query.branch_id;
  
      // Check if branchId is provided
      if (!branchId) {
        return res.status(400).json({ error: 'Branch ID is required' });
      }
  
      // Fetch submissions with 'waiting' status and specific branch_id from the database
      const submissions = await Submission.getWaitingSubmissions(branchId);
      res.json(submissions);
      console.log("Hellop")
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  
router.delete('/:id', authenticateAndAuthorize, async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const existingSubmission = await Submission.getSubmissionById(submissionId);

    if (!existingSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submissionDeleted = await existingSubmission.delete();

    const io = require('../socket').getIo();

    io.emit('submissionDeleted', submissionId);

    if (submissionDeleted) {
      res.status(200).json({ message: 'Submission deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete submission' });
    }
  } catch (error) {
    errorHandler(res, error);
  }
});

  

module.exports = router;
