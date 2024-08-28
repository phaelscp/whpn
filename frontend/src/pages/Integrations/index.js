import React from 'react';

import { Grid } from '@material-ui/core';

import mikwebImg from '../../assets/mikweb.png';
import asaasImg from '../../assets/asaas.png';

import MainHeader from '../../components/MainHeader';
import Title from '../../components/Title';
import MainContainer from '../Reports/components/MainContainer';
import IntegrationLinkBox from './components/IntegrationLinkBox';
import hinovaImg from '../../assets/hinova.png';
import siprovImg from '../../assets/siprov.png';
import blingImg from '../../assets/bling.png';

const Integrations = () => {
  return (
    <MainContainer>
      <MainHeader>
        <Title>Integrações</Title>
      </MainHeader>
      <Grid container spacing={4} sx={{ overflowY: 'unset' }}>


           {/* FLOWISE */}
            <Grid item xs={3}>
          <IntegrationLinkBox
            title="FlowIse"
            link="/integrations/flowise"
            customStyle={{ marginTop: '55px' }}
            img="https://ai-infrastructure.org/wp-content/uploads/2023/08/FlowiseAI-Logo.png"
            />
        </Grid>








      </Grid>
    </MainContainer>
  );
};

export default Integrations;