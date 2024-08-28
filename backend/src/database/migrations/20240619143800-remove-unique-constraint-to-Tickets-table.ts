'use strict';
import { DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Tickets', 'contactid_companyid_unique');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Tickets', {
      type: 'unique',
      name: 'contactid_companyid_unique',
      fields: ['contactId', 'companyId']
    });
  }
};
