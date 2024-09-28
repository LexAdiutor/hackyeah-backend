export const FORM2: (RadioQuestion | SelectQuestion | TextQuestion)[] = [
    {
        name: 'location',
        type: 'radio',
        title: 'Miejsce położenia rzeczy lub miejsce wykonywania prawa majątkowego',
        required: true,
        options: [
            'terytorium RP',
            'poza terytorium RP',
        ],
    },
    {
        name: 'activityPerformencePlace',
        type: 'radio',
        title: 'Miejsce dokonania czynności cywilnoprawnej',
        required: true,
        options: [
            'terytorium RP',
            'poza terytorium RP',
        ],
    },
];