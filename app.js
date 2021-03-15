'use strict';

class Item {
    id;
    description;
    value;

    constructor(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }
}

class Budget {
    items = {
        exp: [],
        inc: []
    };
    total = {
        exp: 0,
        inc: 0
    };
    budget = 0;
    percentage = -1;
}

class BudgetController {
    id;
    description;
    value;
    data = new Budget();

    calculateTotal(type) {
        let sum = 0;
        this.data.items[type].forEach(function (cur) {
            sum += cur.value;
        });
        this.data.total[type] = sum;
    };

    addItem(type, desc, val) {
        let newItem, id;

        //[1 2 3 4 5], next ID = 6
        //[1 2 4 6 8], next ID = 9
        // ID = last ID + 1

        // Create new ID
        if (this.data.items[type].length > 0)
            id = this.data.items[type][this.data.items[type].length - 1].id + 1;
        else
            id = 0;

        let item = new Item(id, desc, val);
        // Push it into our data structure
        this.data.items[type].push(item);
        // Return the new element
        return item;
    }

    calculateBudget() {
        // calculate total income and expenses
        this.calculateTotal('exp');
        this.calculateTotal('inc');

        // Calculate the budget: income - expenses
        this.data.budget = this.data.total.inc - this.data.total.exp;
        // calculate the percentage of income that we spent
        if (this.data.total.inc > 0) {
            this.data.percentage = Math.round((this.data.total.exp / this.data.total.inc) * 100);
        } else {
            this.data.percentage = -1;
        }
        // expense = 100 and income 300, spent 33.333% = 100/300 = 0.3333 * 100
    }

    getBudget() {
        return {
            budget: this.data.budget,
            totalInc: this.data.total.inc,
            totalExp: this.data.total.exp,
            percentage: this.data.percentage
        };
    }

}

class UIController {

    DOM_STRINGS = Object.freeze({
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',

        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',

        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',

        container: '.container',
        expensesPerLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    });

    format(num, type) {
        let numSplit, int, dec;
        /*
            + or - before number
            exactly 2 decimal points
            comma separating the thousands

            2310.4567 -> + 2,310.46
            2000 -> + 2,000.00
            */

        num = Math.abs(num);
        num = num.toFixed(2);
        numSplit = num.split('.');
        int = numSplit[0];
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); //input 23510, output 23,510
        }
        dec = numSplit[1];
        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    }

    getInput() {
        return {
            type: document.querySelector(this.DOM_STRINGS.inputType).value, // Will be either inc or exp
            description: document.querySelector(this.DOM_STRINGS.inputDescription).value,
            value: parseFloat(document.querySelector(this.DOM_STRINGS.inputValue).value)
        };
    }

    addListItem(obj, type) {
        let html, element;

        // Create HTML string with placeholder text
        if (type === 'inc') {
            element = this.DOM_STRINGS.incomeContainer;
            html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
        } else if (type === 'exp') {
            element = this.DOM_STRINGS.expensesContainer;
            html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
        }

        // Replace the placeholder text with some actual data
        html = html.replace('%id%', obj.id)
            .replace('%description%', obj.description)
            .replace('%value%', this.format(obj.value, type));

        // Insert the HTML into the DOM
        document.querySelector(element).insertAdjacentHTML('beforeend', html);
    }

    clearFields() {
        let fields, fieldsArr;
        fields = document.querySelectorAll(this.DOM_STRINGS.inputDescription + ', ' + this.DOM_STRINGS.inputValue);
        fieldsArr = Array.prototype.slice.call(fields);
        fieldsArr.forEach(function (current) {
            current.value = "";
        });
        fieldsArr[0].focus();
    }

    displayBudget(obj) {
        let type;
        obj.budget > 0 ? type = 'inc' : type = 'exp';

        document.querySelector(this.DOM_STRINGS.budgetLabel).textContent = this.format(obj.budget, type);
        document.querySelector(this.DOM_STRINGS.incomeLabel).textContent = this.format(obj.totalInc, 'inc');
        document.querySelector(this.DOM_STRINGS.expensesLabel).textContent = this.format(obj.totalExp, 'exp');

        if (obj.percentage > 0) {
            document.querySelector(this.DOM_STRINGS.percentageLabel).textContent = obj.percentage + '%';
        } else {
            document.querySelector(this.DOM_STRINGS.percentageLabel).textContent = '---';
        }
    }

    displayMonth() {
        let now = new Date();
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let month = now.getMonth();
        let year = now.getFullYear();
        document.querySelector(this.DOM_STRINGS.dateLabel).textContent = months[month] + ' ' + year;
    }

}

class AppController {
    budgetController;
    uiController;

    constructor(budgetController, uiController) {
        this.budgetController = budgetController;
        this.uiController = uiController;

        this.uiController.displayBudget({
            budget: 0,
            totalInc: 0,
            totalExp: 0,
            percentage: -1
        });

        this.uiController.displayMonth();
        this.setupEventListeners();
    }

    setupEventListeners() {
        let dom = this.uiController.DOM_STRINGS;
        document.querySelector(dom.inputBtn).addEventListener('click', () => {
            this.addItem();
        });
        document.addEventListener('keypress', (event) => {
            if (event.keyCode === 13 || event.which === 13) {
                this.addItem();
            }
        });
    }

    updateBudget() {
        // 1. Calculate the budget
        this.budgetController.calculateBudget();
        // 2. Calculate and Display the budget on the UI
        this.uiController.displayBudget(this.budgetController.getBudget());
    };

    addItem() {
        let input, newItem;
        // 1. Get the field input data
        input = this.uiController.getInput();
        console.log(input);
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // 2. Add the item to the budget controller
            newItem = this.budgetController.addItem(input.type, input.description, input.value);
            // 3. Add the item to the UI
            this.uiController.addListItem(newItem, input.type);
            // 4. Clear the fields
            this.uiController.clearFields();
            // 5. Calculate and update budget.. called each time we entered a new element
            this.updateBudget();
        }
    };

}

new AppController(new BudgetController(), new UIController());






















