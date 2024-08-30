import * as ics from 'ics';
import express, { Request, Response } from 'express';
import getLessonsFromWeek from "./parser";
import { validateAndGetUrlParams, badRequestMessage } from './linkValidator';
import Class from './types/classObject';

const app = express();

app.get('/:facultyGroup', async (req: Request, res: Response) => {
  const dictUrl = validateAndGetUrlParams(req);
  if (dictUrl === null) {
    return res.status(500).send(badRequestMessage);
  }

  let lessons: Class[];
  try {
    lessons = await getLessonsFromWeek(dictUrl);
  } catch (e) {
    let message = 'Неизвестная ошибка.';
    if (e instanceof Error) {
      message = e.message;
      if (message === 'Request failed with status code 404')
        message = badRequestMessage;
    }
    return res.status(500).send(message);
  }

  const events: ics.EventAttributes[] = [];
  lessons.forEach((lesson) => events.push(lesson.toIcsEvent()))

  const { error, value } = ics.createEvents(events);
  if (error) {
    return res.status(500).send(error.message);
  }
  res.set('Content-Type', 'text/calendar');

  res.send(value);
});


app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});