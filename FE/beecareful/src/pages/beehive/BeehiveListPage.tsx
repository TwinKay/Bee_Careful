import Button from '@/components/common/Button';
import { ROUTES } from '@/config/routes';
import { Link } from 'react-router-dom';

const BeehiveListPage = () => {
  return (
    <div>
      <h1>Beehive List</h1>
      <Button>
        <Link to={ROUTES.BEEHIVE_DETAIL('1')}>Go to Beehive Detail (id:1)</Link>
      </Button>
      <Button>
        <Link to={ROUTES.DIAGNOSIS_CREATE}>Go to Diagnosis Create</Link>
      </Button>
    </div>
  );
};
export default BeehiveListPage;
