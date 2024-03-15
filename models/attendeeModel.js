var db = require('../config/db')

class Attendee {
  constructor({ id, name, phone_number, num_of_persons, seatPreference, branchId }) {
    this.id = id;
    this.name = name;
    this.phone_number = phone_number;
    this.num_of_persons = num_of_persons;
    this.seatPreference = seatPreference;
    this.branchId = branchId
  }

  static async getAttendeeById(attendeeId) {
    try {
      const [results] = await db.execute('SELECT * FROM attendees WHERE id = ?', [attendeeId]);

      if (results.length > 0) {
        const attendee = results[0];
        return new Attendee(attendee);
      } else {
        console.log(`Attendee with ID ${attendeeId} not found`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching attendee by ID:', error);
      throw error;
    }
  }

  async delete() {
    try {
        const [result] = await db.execute('DELETE FROM attendees WHERE id = ?', [this.id]);

        return result.affectedRows === 1;
    } catch (error) {
      console.error(error);
      throw new Error('Error deleting project from the database');
    }
  }

  static async getWaitingAttendee(branchId) {
    try {
      // Fetch attendees with 'waiting' status and specific branch_id from the database
      const [results] = await db.execute('SELECT * FROM attendees WHERE status = "waiting" AND branch_id = ? ORDER BY startTime DESC', [branchId]);
      return results || [];
    } catch (error) {
      console.error('Error fetching waiting attendees from the database:', error);
      throw error;
    }
  }

    async postAttendee(io, res) {
      // Save the attendee to the database
      const attendee = { ...this, startTime: new Date() };
      await this.saveAttendeeToDatabase(attendee);
    
      // Calculate previous attendees and average waiting time
      const { previousattendees, averageWaitingTime, order } = await this.getAttendeeDetails(attendee);

      res.json({ averageWaitingTime, order });
    
      // Modify the attendee object to include additional information
      const updatedAttendee = {
        ...attendee,
      };
    
      // Emit the new attendee along with additional information
      if(this.branchId === '1'){
        io.emit('newAttendee1', updatedAttendee);
      } else if(this.branchId === '2'){
        io.emit('newAttendee2', updatedAttendee);
      }
      console.log(this.branchId)
    }
    

    saveAttendeeToDatabase = async (attendee) => {
      try {
        console.log(attendee)
        const [result] = await db.execute(
          'INSERT INTO attendees SET name = ?, phone_number = ?, num_of_persons = ?, seatPreference = ?, startTime = ?, branch_id = ?',
          [
              attendee.name,
              attendee.phone_number,
              attendee.num_of_persons,
              attendee.seatPreference,
              attendee.startTime,
              attendee.branchId
          ]
      );

        console.log('Attendee saved to the database');
        return result;
      } catch (error) {
        console.error('Error saving attendee to the database:', error);
        throw error;
      }
    };
  
      
}

module.exports = Attendee;