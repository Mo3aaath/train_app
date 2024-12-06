class Reservation {
    constructor(passenger, seats, timestamp, paymentDeadline = 15 * 60 * 1000) {
        this.passenger = passenger;
        this.seats = seats;
        this.timestamp = timestamp;
        this.deadline = timestamp + paymentDeadline;
    }

    isExpired() {
        return Date.now() > this.deadline;
    }
}
