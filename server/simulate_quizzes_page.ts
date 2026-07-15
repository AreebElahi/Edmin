import jwt from 'jsonwebtoken';

async function main() {
  const token = jwt.sign(
    { userId: 3, id: 3, role: 'STUDENT' }, // Using both userId and id just in case
    '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d',
    { expiresIn: '15m' }
  );

  function unwrap(envelope: any) {
    if (!envelope || typeof envelope !== 'object') {
      throw { code: 'API_ERROR', message: 'No response' };
    }
    if (!envelope.success || envelope.data === undefined) {
      throw { code: envelope.error?.code || 'API_ERROR', message: envelope.error?.message || 'Error' };
    }
    return envelope.data;
  }

  async function apiGet(url: string) {
    const res = await fetch('http://localhost:5000/api/v1' + url, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return unwrap(data);
  }
    if (!envelope || typeof envelope !== 'object') {
      throw { code: 'API_ERROR', message: 'No response' };
    }
    if (!envelope.success || envelope.data === undefined) {
      throw { code: envelope.error?.code || 'API_ERROR', message: envelope.error?.message || 'Error' };
    }
    return envelope.data;
  }

  async function apiGet(url: string) {
    const res = await apiClient.get(url);
    return unwrap(res as any);
  }

  try {
    const quizzesData = await apiGet('/student/quizzes');
    console.log('student/quizzes ->', quizzesData);

    let aiQuizzesData: any[] = [];
    try {
      const aiRes = await apiGet('/ai-quiz/');
      aiQuizzesData = (aiRes as any)?.data || (aiRes as any) || [];
      console.log('ai-quiz/ ->', aiQuizzesData);
    } catch (e) {
      console.error("Failed to fetch exam quizzes", e);
    }

    const mappedNormal = (quizzesData || []).map((q: any) => ({
      quizid: q.quizId,
      title: q.title,
      duration: q.duration,
      totalmarks: q.totalmarks,
      description: q.description || null,
      courseName: q.course?.name || '',
      courseCode: q.course?.code || '',
      attempted: q.status === 'completed',
      score: q.attempt?.score ?? null,
      submittedat: q.attempt?.submittedAt ?? null,
      isExam: false
    }));

    const mappedExam = aiQuizzesData.map((q: any) => ({
      quizid: q.aiquizid,
      title: q.title,
      duration: q.timelimitminutes,
      totalmarks: q.questioncount,
      description: q.description || null,
      courseName: q.courseoffering?.course?.name || '',
      courseCode: q.courseoffering?.course?.code || '',
      attempted: q.attempts?.length > 0,
      score: q.attempts?.[0]?.score ?? null,
      submittedat: q.attempts?.[0]?.status === 'SUBMITTED' || q.attempts?.[0]?.status === 'AUTO_SUBMITTED' ? new Date().toISOString() : null,
      isExam: true
    }));

    console.log('All mapped successfully:', mappedNormal.length, mappedExam.length);
  } catch (err) {
    console.log('Outer catch block caught an error!');
    console.error(err);
  }
}

main().catch(console.error);
