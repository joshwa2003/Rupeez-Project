import React from 'react';
import { Flex } from '@chakra-ui/react';
import GroupManager from '../../components/Groups/GroupManager';

const GroupManagerView = () => {
  return (
    <Flex flexDirection='column' pt={{ base: "80px", md: "75px" }} px={{ base: "0px", md: "0px" }}>
      <GroupManager />
    </Flex>
  );
};

export default GroupManagerView;
