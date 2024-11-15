
import validateMenteeFilters from './validateMenteeFilters';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const filters = req.body;
    const validationErrors = validateMenteeFilters(filters);

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    return res.status(200).json({ message: 'Validation successful' });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}