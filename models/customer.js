"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** methods for getting/setting id (validate id not less than zero) */

  set id(val) {
    if (val <= 0) {
      throw new Error();
    }
    this._id = val;
  }

  get id() {
    return this._id;
  }

  /** methods for getting/setting notes (keep as empty string, not NULL) */


  set notes(val) {
    this._notes = val || "";
  }

  get notes() {
    return this._notes;
  }

  /** methods for getting/setting phone #. */

  set phone(val) {
    this._phone = val || null;
  }

  get phone() {
    return this._phone;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** search for all customers that match search query. */

  static async search(searchTerm) {

    const results = await db.query(
      `SELECT id,
          first_name AS "firstName",
          last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE first_name ILIKE $1 OR last_name ILIKE $1
           ORDER BY last_name, first_name`,
      [`%${searchTerm}%`]

    );

    return results.rows.map(c => new Customer(c));
  }

  /** find top 10 customers. */

  static async topTen() {
    const results = await db.query(
      `SELECT customers.id,
                    first_name AS "firstName",
                    last_name  AS "lastName",
                    phone,
                    customers.notes,
                    COUNT(reservations.id) as C
             FROM customers
             JOIN reservations
             ON customers.id = reservations.customer_id
             GROUP BY customers.id
             ORDER BY C DESC
             LIMIT 10`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** return full name of customer. */

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }


}

module.exports = Customer;
