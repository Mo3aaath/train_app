class Train {
    constructor(number, name, from, to, departure, arrival, date, totalSeats = 50) {
        this.number = number;
        this.name = name;
        this.from = from;
        this.to = to;
        this.departure = departure;
        this.arrival = arrival;
        this.date = date;
        this.seats = Array(totalSeats).fill(0); // 0 = available, 1 = booked, 2 = temporarily reserved
        this.waitingList = [];
        this.reservations = [];
    }

    addReservation(reservation) {
        this.reservations.push(reservation);
        reservation.seats.forEach(seat => (this.seats[seat] = 2)); // Temporarily reserve seats
    }

    confirmReservation(reservation) {
        const index = this.reservations.findIndex(res => res === reservation);
        if (index !== -1) {
            reservation.seats.forEach(seat => (this.seats[seat] = 1)); // Mark seats as booked
            this.reservations.splice(index, 1);
        }
    }

    cancelReservation(reservation) {
        const index = this.reservations.findIndex(res => res === reservation);
        if (index !== -1) {
            reservation.seats.forEach(seat => (this.seats[seat] = 0)); // Free seats
            this.reservations.splice(index, 1);
            this.allocateSeatsFromWaitingList();
        }
    }

    addToWaitingList(passenger) {
        this.waitingList.push(passenger);
    }

    allocateSeatsFromWaitingList() {
        while (this.waitingList.length > 0 && this.seats.includes(0)) {
            const passenger = this.waitingList.shift();
            const availableSeats = this.seats
                .map((seat, index) => (seat === 0 ? index : null))
                .filter(index => index !== null);

            if (availableSeats.length >= passenger.requestedSeats) {
                const allocatedSeats = availableSeats.slice(0, passenger.requestedSeats);
                const reservation = new Reservation(passenger, allocatedSeats, Date.now());
                this.addReservation(reservation);
            } else {
                this.waitingList.unshift(passenger); // Put passenger back in the waiting list
                break;
            }
        }
    }
}
