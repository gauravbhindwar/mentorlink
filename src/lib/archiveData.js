import { Mentor, Mentee, Admin, Meeting, HistoricalData } from "./dbModels";

async function archiveData(model, filter) {
    const documents = await model.find(filter);
    for (const doc of documents) {
        const historicalDoc = new HistoricalData({
            collectionName: model.collection.collectionName,
            documentId: doc._id,
            data: doc.toObject(),
        });
        await historicalDoc.save();
        await doc.remove();
    }
}

export async function archiveOldData() {
    const currentYear = new Date().getFullYear();
    const twentyYearsAgo = currentYear - 20;

    // Archive data older than twenty years
    await archiveData(Mentor, { year: { $lt: twentyYearsAgo } });
    await archiveData(Mentee, { year: { $lt: twentyYearsAgo } });
    await archiveData(Meeting, { year: { $lt: twentyYearsAgo } });
    await archiveData(Admin, { year: { $lt: twentyYearsAgo } });
}

export async function archiveDataByTerm(term) {
    // Archive data by term (odd/even)
    await archiveData(Mentor, { term });
    await archiveData(Mentee, { term });
    await archiveData(Meeting, { term });
    await archiveData(Admin, { term });
}

export async function archiveDataBySemester(semester) {
    // Archive data by semester
    await archiveData(Mentor, { semester });
    await archiveData(Mentee, { semester });
    await archiveData(Meeting, { semester });
    await archiveData(Admin, { semester });
}

export async function archiveDataByYearAndTerm(year, term) {
    // Archive data by year and term
    await archiveData(Mentor, { year, term });
    await archiveData(Mentee, { year, term });
    await archiveData(Meeting, { year, term });
    await archiveData(Admin, { year, term });
}

export async function archiveDataBySection(section) {
    // Archive data by section
    await archiveData(Mentor, { section });
    await archiveData(Mentee, { section });
    await archiveData(Meeting, { section });
    await archiveData(Admin, { section });
}

export async function archiveDataByMentorMujid(mentorMujid) {
    // Archive data by mentor mujid
    await archiveData(Mentor, { mujid: mentorMujid });
    await archiveData(Mentee, { mentorMujid });
    await archiveData(Meeting, { mentor: mentorMujid });
}

export async function archiveDataByMenteeMujid(menteeMujid) {
    // Archive data by mentee mujid
    await archiveData(Mentee, { mujid: menteeMujid });
    await archiveData(Meeting, { mentee: menteeMujid });
}

export async function getHistoricalData(filters = {}) {
    const query = {};
    if (filters.year) query['data.year'] = filters.year;
    if (filters.term) query['data.term'] = filters.term;
    if (filters.semester) query['data.semester'] = filters.semester;
    if (filters.collection) query.collectionName = filters.collection;

    return await HistoricalData.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 100)
        .skip(filters.skip || 0);
}