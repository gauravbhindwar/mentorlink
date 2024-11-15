import {connect} from '../../../../lib/dbConfig';
import {Mentee} from '../../../../lib/dbModels';

export default async function handler(req, res) {
    await connect();

    if (req.method === 'GET') {
        try {
            const mentees = await Mentee.find({});
            res.status(200).json(mentees);
        } catch (error) {
            console.error('Error fetching mentees:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}