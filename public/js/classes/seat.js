class Seat {
    constructor(number, status = 0) {
        this.number = number;
        this.status = status; // 0 = available, 1 = booked, 2 = temporarily reserved
    }
}
