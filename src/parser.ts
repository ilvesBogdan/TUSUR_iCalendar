import axios from "axios";
import { JSDOM } from "jsdom";
import ClassData from "./types/interfaceData";
import { ParamsUrl } from "./linkValidator";
import Class from "./types/classObject";


const classNameTableRasp = 'table-responsive';
const subjectInfoElement = 'td.lesson_cell';
const regExpCupNotDateTime = /^[^:]+:[\s\\n]*/;
const regExpCupNotData = /:[\s\\n]+/;

interface ReturnsTablesElement {
    tableElement: Element;
    weeksIds: Promise<number[]> | null;
}

interface ReturnsRaspTable {
    tableElement: Element | null;
    weeksIds: number[] | null;
}

/**
 * Генератор, который возвращает текстовое содержимое элементов,
 * соответствующих селектору, в указанном элементе.
 * 
 * @param element - элемент, в котором осуществляется поиск
 * @param querySelector - селектор для поиска элементов
 * @returns генератор, возвращающий текстовое содержимое элементов
 */
function* classDataIterator(element: Element, querySelector: string): Generator<string> {
    const elementsList = Array.from(element.querySelectorAll(querySelector));
    for (const element of elementsList) {
        const textContent = element.textContent?.trim() ?? "";
        yield textContent;
    }
}

/**
 * Получает идентификаторы недель из HTML страницы с расписанием.
 * 
 * @param document - HTML страница, из которой нужно получить идентификаторы недель.
 * @param numWeeks - Количество недель, для которых нужно получить идентификаторы.
 * @returns - Массив идентификаторов недель.
 * @throws - Выбрасывает ошибку, если не удалось найти таблицу со список недель.
 */
const funcGetWeeksIds = async (document: Document, numWeeks: number): Promise<number[]> => {
    const ulWeeks = document.querySelector('ul.weeks');
    if (!ulWeeks) throw new Error('Не удалось найти список недель.');
    const weeksIds: number[] = [];
    let currentWeek = false;

    for (const week of ulWeeks.children) {
        if (currentWeek) {
            const a = week.querySelector('a');
            if (a !== null) {
                const idMatch = a.href.match(/(\d+)\/?$/);
                if (idMatch !== null && idMatch.length > 0) {
                    const id = Number(idMatch[idMatch.length - 1]);
                    if (!isNaN(id)) weeksIds.push(id);
                }
            }
            if (--numWeeks) continue;
            else break;
        }
        if (week.classList.contains('current')) currentWeek = true;
    }
    return weeksIds;
}

/**
 * Получает элемент таблицы расписания по URL.
 * @param url - URL для получения данных.
 * @param weeksFunc - Функция для обработки данных о неделях.
 * @returns Элемент таблицы расписания.
 * @throws Ошибка, если не удалось найти таблицу расписания.
 */
const getTablesElement = async (url: string, numWeeks?: number): Promise<ReturnsTablesElement> => {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const { document } = dom.window;

    let weeksIds: Promise<number[]> | null = null;
    if (numWeeks !== undefined)
        weeksIds = funcGetWeeksIds(document, numWeeks);

    const tableNode = document.getElementsByClassName(classNameTableRasp);
    if (tableNode.length > 0) {
        return { tableElement: tableNode[0], weeksIds: weeksIds };
    }

    throw new Error(`Не удалось найти таблицу расписания по классу "${classNameTableRasp}".`);
}

/**
 * Получает элемент таблицы с расписания для указанной группы и недели.
 * 
 * @param group - Номер группы.
 * @param week - ID недели.
 * @param weeksFunc - Функция для получения списка последующих недель.
 * @returns Элемент таблицы расписания или null, если таблица не найдена.
 */
const getRaspTable = async (baseUrl: string, week?: number, numWeeks?: number): Promise<ReturnsRaspTable> => {
    const result = await getTablesElement(`${baseUrl}${week ? `?week_id=${week}` : ''}`, numWeeks);
    const tables = result.tableElement.children;

    // Выбираем из множества таблиц таблицу с расписанием
    const raspTable = tables.length > 1 ? tables[1] : null;
    const weeksIds = await result.weeksIds;
    return { tableElement: raspTable, weeksIds: weeksIds };
}

/**
 * Возвращает данные о месте проведения занятия.
 *
 * @param element - Элемент с информацией о месте проведения занятия.
 * @param str - Разделитель описания и значения.
 * @returns Массив строк с данными месте проведения занятия.
 */
const getPlace = (element: Element, str: string): string[] => {
    let strarr = str.split(':');
    if (strarr.length > 1 && strarr[1].length < 2) return [];
    strarr = strarr.map(x => x.trim());
    const i = element.querySelector('.auditoriums i')
    if (i === null) return strarr;
    const istr = i.outerHTML.match(/title\s*=\s*"([^"]+)/);
    if (istr === null) return strarr;
    return strarr.concat([istr[1]]);
}

/**
 * Возвращает текстовое содержимое элемента по заданному селектору.
 *
 * @param element - Элемент, внутри которого нужно выполнить поиск.
 * @param selector - Селектор элемента, текстовое содержимое которого нужно получить.
 * @returns Текстовое содержимое элемента.
 * @throws Если элемент не найден по заданному селектору.
 */
const getTextContent = (element: Element, selector: string): string => {
    const n = element.querySelector(selector);
    if (!n) throw new Error(`Не удалось найти элемент по селектору "${selector}".`);
    return n.textContent?.trim() || '';
}

/**
 * Парсит данные о предмете из элемента ячейки с предметом.
 *
 * @param element - Элемент ячейки с данными о предмете.
 * @returns Структура с данными о предмете или null, если в ячейке нет предмета.
 */
const getClassObject = async (element: Element): Promise<ClassData | null> => {
    const lessonsWrapper = element.querySelector('div.lessons-wrapper');
    if (lessonsWrapper === null) throw new Error('Не удалось найти элэмент ".lessons_wrapper".');
    const hiddenForPrint = element.querySelector('div.hidden_for_print');
    if (hiddenForPrint === null) throw new Error('Не удалось найти элэмент ".hidden_for_print".');

    // Ячейка с занятием пуста
    if (!(lessonsWrapper.children.length > 0 && hiddenForPrint.children.length > 0)) return null;

    // Занятие отменено
    if (lessonsWrapper.querySelector('.holiday-description') !== null) return null;

    const classData: ClassData = {
        name: "", type: "", longName: "", date: "",
        time: "", place: [], data: [], comment: ""
    };


    classData.name = getTextContent(lessonsWrapper, '.discipline');
    classData.type = getTextContent(lessonsWrapper, '.kind');
    classData.longName = getTextContent(hiddenForPrint, 'h4.modal-title');
    classData.comment = lessonsWrapper.querySelector('[class="note"]')?.textContent?.trim() || '';

    const dataIterator = classDataIterator(hiddenForPrint, '.modal-body > p')

    dataIterator.next();
    classData.date = dataIterator.next().value.replace(regExpCupNotDateTime, '');
    classData.time = dataIterator.next().value.replace(regExpCupNotDateTime, '');
    classData.place = getPlace(hiddenForPrint, dataIterator.next().value);

    for (const data of dataIterator) {
        if (data.substring(0, 6) === 'Ссылка') continue;
        classData.data.push(data.replace(regExpCupNotData, ': '));
    }

    return classData;
}

/**
 * Применяет передаваемую функцию к каждому предмету из таблицы с расписанием,
 * которая передается первым аргументом.
 *
 * @param subject - Элемент с расписанием занятий.
 * @param func - Функция, которая будет вызываться для каждого занятия из раписания.
 */
const addClassObject = async (subject: Element | null): Promise<ClassData[] | null> => {
    if (subject === null) return null;
    const classesObjects: ClassData[] = [];

    for (const subjectInfo of subject.querySelectorAll(subjectInfoElement)) {
        const classObject = await getClassObject(subjectInfo);
        if (classObject !== null) {
            classesObjects.push(classObject);
        }
    }

    return classesObjects;
}

/**
 * Получает список занятий для указанной группы и количества недель.
 * @param params - параметры запроса.
 * @returns Список занятий.
 */
const getLessons = async (params: ParamsUrl): Promise<Class[]> => {
    const classesObjectsPromis: Promise<ClassData[] | null>[] = [];

    const raspTable = (params.weeks && params.weeks > 1)
        ? await getRaspTable(params.url, undefined, params.weeks)
        : await getRaspTable(params.url);

    if (raspTable.tableElement !== null) {
        classesObjectsPromis.push(addClassObject(raspTable.tableElement));
    }

    // Получаем занятия для каждой недели, если они есть
    classesObjectsPromis.push(
        ...(raspTable.weeksIds ?? []).map(
            async (weekId: number): Promise<ClassData[] | null> => {
                const raspTable = await getRaspTable(params.url, weekId);
                if (raspTable.tableElement === null) return null;
                return await addClassObject(raspTable.tableElement);
            }
        )
    );

    // Получем функцию для проверки на занятия подлежащие исключению
    const checkingForUnusedClasses = ((): (c: ClassData) => boolean => {
        if (params.not !== undefined) {
            const not = params.not;
            if (typeof not === 'string')
                return (c: ClassData): boolean => not !== c.name;
            else
                return (c: ClassData): boolean => !not.includes(c.name);
        }
        else
            return (c: ClassData): boolean => true;
    })();

    const lessons: Class[] = [];
    (await Promise.all(classesObjectsPromis)).forEach(classesObject => {
        if (classesObject === null) return;
        classesObject.forEach(classData => {
            if (checkingForUnusedClasses(classData))
                lessons.push(new Class(classData))
        });
    });
    return lessons;
}

export default getLessons;