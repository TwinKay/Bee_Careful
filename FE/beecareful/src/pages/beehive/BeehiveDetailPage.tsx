import Button from '@/components/common/Button';
import { ROUTES } from '@/config/routes';
import { Link } from 'react-router-dom';

const BeehiveDetailPage = () => {
  return (
    <div>
      <h1>Beehive Detail</h1>
      <Button>
        <Link to={ROUTES.DIAGNOSIS_DETAIL}>Go to Diagnosis Detail</Link>
      </Button>
      <Button>
        {' '}
        <Link to={ROUTES.BEEHIVES}>Go to Beehive List</Link>
      </Button>
    </div>
  );
};
export default BeehiveDetailPage;
