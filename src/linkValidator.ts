import { Request } from 'express';

const raspBaseUrl = 'https://timetable.tusur.ru/faculties/';

const badRequestMessage = 'Ошибка: неправильный запрос. Укажите правильные параметры URL-адреса.' +
    '<br />Пример: https://.../fvs_590-1?weeks=3&amp;not=УПД&amp;not=ГПО<br />' +
    'Где fvs – факультет, 590-1 – номер группы, 3 – кол-во недель, УПД и ГПО исключаемые предметы.';

interface ParamsUrl {
    url: string;
    weeks?: number;
    not?: string[] | string;
}

const validateAndGetUrlParams = (req: Request): ParamsUrl | null => {

    // Проверка наличия обязательного параметра 'facultyGroup'
    const { facultyGroup } = req.params;
    const facultyGroupArr = facultyGroup.split('_');
    if (facultyGroupArr.length !== 2) {
        return null;
    }
    const [faculty, group] = facultyGroupArr;

    let { weeks, not } = req.query;
    weeks = weeks as string;
    not = not as string;

    const parms = {} as ParamsUrl;

    // Проверка наличия обязательного параметра 'group'
    if (!group || typeof group !== 'string') {
        return null;
    } else parms.url = `${raspBaseUrl}/${faculty}/groups/${group}`;

    // Проверка типа необязательного параметра 'weeks'
    if (weeks !== undefined && (!weeks || typeof weeks !== 'string' || isNaN(Number(weeks)))) {
        return null;
    } else parms.weeks = Number(weeks);

    // Проверка типа необязательного параметра 'not'
    if (!not && !Array.isArray(not) && not !== undefined) {
        return null;
    } else parms.not = not;

    return parms;
}

export { validateAndGetUrlParams, ParamsUrl, badRequestMessage };