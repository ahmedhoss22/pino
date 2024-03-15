var db = require('../config/db')

class Submission {
  constructor({ id, name, phone_number, num_of_persons, seatPreference, branchId, sock_id }) {
    this.id = id;
    this.name = name;
    this.phone_number = phone_number;
    this.num_of_persons = num_of_persons;
    this.seatPreference = seatPreference;
    this.branchId = branchId
    this.sock_id = sock_id
  }

  static async getSubmissionById(submissionId) {
    try {
      const [results] = await db.execute('SELECT * FROM submissions WHERE id = ?', [submissionId]);

      if (results.length > 0) {
        const submission = results[0];
        return new Submission(submission);
      } else {
        console.log(`Submission with ID ${submissionId} not found`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching submission by ID:', error);
      throw error;
    }
  }

  async delete() {
    try {
        const [result] = await db.execute('DELETE FROM submissions WHERE id = ?', [this.id]);

        return result.affectedRows === 1;
    } catch (error) {
      console.error(error);
      throw new Error('Error deleting project from the database');
    }
  }

  static async getWaitingSubmissions(branchId) {
    try {
      // Fetch submissions with 'waiting' status and specific branch_id from the database
      const [results] = await db.execute('SELECT * FROM submissions WHERE status = "waiting" AND branch_id = ? ORDER BY startTime DESC', [branchId]);
      return results || [];
    } catch (error) {
      console.error('Error fetching waiting submissions from the database:', error);
      throw error;
    }
  }

    async postSubmission(io, res) {
      // Save the submission to the database
      const submission = { ...this, startTime: new Date() };
      const result = await this.saveSubmissionToDatabase(submission, res);
    
      if(result){
        // Calculate previous submissions and average waiting time
        const { previousSubmissions, averageWaitingTime, order } = await this.getSubmissionDetails(submission);
  
        const submissionId = result.insertId;
  
        
        // Modify the submission object to include additional information
        const updatedSubmission = {
          ...submission,
          id: submissionId
        };
        
        res.json({ averageWaitingTime, order, updatedSubmission});
        // Emit the new submission along with additional information
        if(this.branchId === '1'){
          io.emit('newAttendee1', updatedSubmission);
        } else if(this.branchId === '2'){
          io.emit('newAttendee2', updatedSubmission);
        }
        console.log(this.branchId)
      }
    }
    

    saveSubmissionToDatabase = async (submission, res) => {
      try {
        const [duplicates] = await db.execute('SELECT * FROM submissions WHERE phone_number = ?', [this.phone_number]);
        if(duplicates.length > 0){
          res.json({message: 'عذرا تم تسجيلك مسبقا'});
        } else{
          console.log(submission)
          const [result] = await db.execute(
            'INSERT INTO submissions SET name = ?, phone_number = ?, num_of_persons = ?, seatPreference = ?, startTime = ?, branch_id = ?',
            [
                submission.name,
                submission.phone_number,
                submission.num_of_persons,
                submission.seatPreference,
                submission.startTime,
                submission.branchId
            ]
        );
  
          console.log('Submission saved to the database');
          console.log(result)
          return result;
        }
      } catch (error) {
        console.error('Error saving submission to the database:', error);
        throw error;
      }
    };
    
    getSubmissionDetails = async (currentSubmission) => {
      // Get previous submissions
      const [results] = await db.execute('SELECT * FROM submissions WHERE branch_id = ? ORDER BY startTime DESC', [this.branchId]);
      const previousSubmissions = results || [];
    
      // Calculate average waiting time
      const totalWaitingTime = previousSubmissions.reduce((sum, submission) => {
        const elapsedMilliseconds = currentSubmission.startTime - new Date(submission.startTime);
        return sum + elapsedMilliseconds;
      }, 0);
    
      const averageWaitingTime = previousSubmissions.length > 0
        ? totalWaitingTime / previousSubmissions.length
        : 0;
    
      // Calculate order in the list
      const order = previousSubmissions.length;
    
      return { previousSubmissions, averageWaitingTime, order };
    };
      
}

module.exports = Submission;